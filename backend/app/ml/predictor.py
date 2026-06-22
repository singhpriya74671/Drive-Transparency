import numpy as np
import xgboost as xgb
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# ── Synthetic training data ────────────────────────────────────────────────

def _build_training_data():
    np.random.seed(42)
    n = 6000

    age         = np.random.uniform(0, 15, n)
    mileage     = np.random.uniform(0, 200_000, n)
    bat_age     = np.random.uniform(0, 72, n)
    bat_v       = np.random.uniform(10.5, 14.8, n)
    eng_temp    = np.random.uniform(60, 135, n)     # °C
    fuel_eff    = np.random.uniform(4, 28, n)       # km/l
    brake_sc    = np.random.uniform(0, 100, n)      # 0=poor 100=good
    has_dtc     = np.random.randint(0, 2, n).astype(float)
    avg_spd     = np.random.uniform(15, 120, n)     # km/h
    km_oil      = np.random.uniform(0, 15_000, n)
    eng_hrs     = np.random.uniform(0, 5000, n)     # engine runtime hours

    X = np.column_stack([age, mileage, bat_age, bat_v, eng_temp,
                         fuel_eff, brake_sc, has_dtc, avg_spd, km_oil, eng_hrs])

    def noise(n): return np.random.normal(0, 0.04, n)

    brake_y = np.clip(
        (100 - brake_sc) / 100 * 0.65 +
        (mileage / 200_000) * 0.15 +
        has_dtc * 0.12 +
        np.where(avg_spd > 90, 0.08, 0) +
        noise(n), 0, 1
    )
    battery_y = np.clip(
        (bat_age / 72) * 0.55 +
        np.where(bat_v < 12.2, 0.25, 0) +
        np.where(bat_v < 11.8, 0.15, 0) +
        (age / 15) * 0.05 +
        noise(n), 0, 1
    )
    tire_y = np.clip(
        (mileage / 200_000) * 0.55 +
        (age / 15) * 0.20 +
        np.where(avg_spd > 80, 0.10, 0) +
        noise(n), 0, 1
    )
    oil_y = np.clip(
        (km_oil / 15_000) * 0.72 +
        (eng_hrs / 5000) * 0.15 +
        np.where(fuel_eff < 8, 0.08, 0) +
        noise(n), 0, 1
    )
    engine_y = np.clip(
        np.where(eng_temp > 110, 0.40, 0) +
        np.where(eng_temp > 120, 0.25, 0) +
        has_dtc * 0.20 +
        (age / 15) * 0.10 +
        noise(n), 0, 1
    )
    fuel_sys_y = np.clip(
        np.where(fuel_eff < 8, 0.50, 0) +
        np.where(fuel_eff < 12, 0.20, 0) +
        has_dtc * 0.15 +
        noise(n), 0, 1
    )

    return X, {"brakes": brake_y, "battery": battery_y, "tyres": tire_y,
               "engine_oil": oil_y, "engine": engine_y, "fuel_system": fuel_sys_y}


def _train():
    X, targets = _build_training_data()
    params = dict(n_estimators=120, max_depth=4, learning_rate=0.08,
                  objective="reg:squarederror", random_state=42,
                  subsample=0.8, colsample_bytree=0.8)
    models = {}
    for name, y in targets.items():
        m = xgb.XGBRegressor(**params)
        m.fit(X, y, verbose=False)
        models[name] = m
    return models

_MODELS: Dict[str, xgb.XGBRegressor] = _train()

FEATURE_NAMES = [
    "vehicle_age_years", "mileage_km", "battery_age_months", "battery_voltage",
    "engine_temp_c", "fuel_efficiency_kmpl", "brake_score", "has_dtc",
    "avg_speed_kmh", "km_since_oil_change", "engine_runtime_hours",
]


# ── Cost & text look-ups ───────────────────────────────────────────────────

COST_ESTIMATES = {
    "engine_oil":   (500,   1_200),
    "air_filter":   (300,     800),
    "battery":      (2_500, 6_000),
    "brakes":       (1_500, 5_000),
    "tyres":        (3_000, 8_000),
    "coolant":      (400,   1_000),
    "transmission": (2_000, 8_000),
    "spark_plugs":  (600,   1_800),
    "fuel_system":  (800,   2_500),
    "engine":       (3_000,12_000),
}

_URGENCY_WINDOWS = {"critical": (7, 30), "warning": (30, 90), "good": (120, 365)}

EXPLANATIONS = {
    "engine_oil": {
        "critical": "Oil change interval exceeded by {mileage_since_change:.0f} km. Degraded oil accelerates engine wear.",
        "warning":  "Approaching oil change interval ({mileage_since_change:.0f} km since last change). Schedule soon.",
        "good":     "Engine oil is within acceptable service interval ({mileage_since_change:.0f} km since change).",
    },
    "battery": {
        "critical": "Battery is {battery_age} months old — beyond typical 36–48 month lifespan. Risk of sudden failure.",
        "warning":  "Battery is {battery_age} months old and approaching end of service life. Plan replacement.",
        "good":     "Battery ({battery_age} months old) is within expected service life.",
    },
    "brakes": {
        "critical": "Brake condition is poor and braking issues detected. Immediate inspection required — safety risk.",
        "warning":  "Brake condition is fair or irregularities reported. Inspection recommended.",
        "good":     "Brakes are in good condition with no reported issues.",
    },
    "tyres": {
        "warning":  "At {mileage_km:.0f} km, tyre wear should be inspected — rotation or replacement may be required.",
        "good":     "Tyre condition appears satisfactory at current mileage.",
    },
    "coolant": {
        "warning":  "Unusual engine noises reported — potential cooling system issue. Inspect coolant and hoses.",
        "good":     "Cooling system appears to be functioning normally.",
    },
    "fuel_system": {
        "warning":  "Fuel efficiency of {fuel_eff:.1f} km/l is below expected. May indicate clogged injectors or air filter.",
        "good":     "Fuel system operating within normal efficiency parameters.",
    },
    "transmission": {
        "warning":  "Vibrations reported at {mileage_km:.0f} km. Check transmission fluid and mounts.",
        "good":     "Transmission appears to be functioning normally.",
    },
    "spark_plugs": {
        "warning":  "Vehicle is {vehicle_age:.0f} years old — spark plugs may need inspection for performance and efficiency.",
        "good":     "Spark plugs within expected service life.",
    },
    "engine": {
        "critical": "High engine temperature and/or fault codes detected. Immediate inspection required.",
        "warning":  "Engine temperature slightly elevated or fault codes present. Monitor closely.",
        "good":     "Engine operating within normal parameters.",
    },
}


# ── Helper utilities ───────────────────────────────────────────────────────

def _days_since(dt) -> float:
    if dt is None:
        return 999.0
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return 999.0
    now = datetime.now(timezone.utc)
    aware = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return max((now - aware).days, 0)


def _prob_to_urgency(prob: float) -> str:
    if prob >= 0.70:
        return "critical"
    if prob >= 0.40:
        return "warning"
    return "good"


def _prob_to_days(prob: float) -> int:
    if prob >= 0.85:
        return 7
    if prob >= 0.70:
        return 30
    if prob >= 0.50:
        return 45
    if prob >= 0.40:
        return 90
    return 180


def _prob_to_health(prob: float) -> float:
    return round(max(5.0, (1 - prob) * 100), 1)


def _safe_float(val, default):
    try:
        return float(val) if val is not None else float(default)
    except (TypeError, ValueError):
        return float(default)

def _extract_features(v: Dict[str, Any]) -> np.ndarray:
    mfg_year        = v.get("manufacturing_year") or 2020
    vehicle_age     = max(datetime.now(timezone.utc).year - int(mfg_year), 0)
    mileage         = _safe_float(v.get("mileage_km"), 0)
    bat_age         = _safe_float(v.get("battery_age_months"), 12)
    bat_v           = _safe_float(v.get("battery_voltage"), 12.6)
    eng_temp        = _safe_float(v.get("engine_temp_c"), 90)
    fuel_eff        = _safe_float(v.get("fuel_efficiency_kmpl"), 15)
    brake_condition = v.get("brake_condition") or "good"
    brake_sc        = {"good": 90, "fair": 50, "poor": 15}.get(brake_condition, 90)
    has_dtc         = _safe_float(v.get("has_dtc"), 0)
    avg_spd         = _safe_float(v.get("avg_speed_kmh"), 45)
    last_oil        = v.get("last_oil_change_date")
    days_oil        = _days_since(last_oil)
    km_oil          = min(days_oil * 30, mileage)
    eng_hrs         = _safe_float(v.get("engine_runtime_hours"), vehicle_age * 300)

    return np.array([[vehicle_age, mileage, bat_age, bat_v, eng_temp,
                      fuel_eff, brake_sc, has_dtc, avg_spd, km_oil, eng_hrs]])


# ── Main prediction function ───────────────────────────────────────────────

def predict_maintenance(vehicle_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    feats = _extract_features(vehicle_data)

    mfg_year        = vehicle_data.get("manufacturing_year") or 2020
    vehicle_age     = max(datetime.now(timezone.utc).year - int(mfg_year), 0)
    mileage         = _safe_float(vehicle_data.get("mileage_km"), 0)
    battery_age     = int(_safe_float(vehicle_data.get("battery_age_months"), 12))
    brake_condition = vehicle_data.get("brake_condition") or "good"
    fuel_eff        = vehicle_data.get("fuel_efficiency_kmpl")  # None means skip fuel section
    bat_v           = _safe_float(vehicle_data.get("battery_voltage"), 12.6)
    eng_temp        = _safe_float(vehicle_data.get("engine_temp_c"), 90)
    has_noise       = bool(vehicle_data.get("has_unusual_noise", False))
    has_vibration   = bool(vehicle_data.get("has_vibration", False))
    has_braking     = bool(vehicle_data.get("has_braking_issues", False))
    has_dtc         = bool(vehicle_data.get("has_dtc", False))

    last_oil_date   = vehicle_data.get("last_oil_change_date")
    days_oil        = _days_since(last_oil_date)
    km_oil          = min(days_oil * 30, mileage)

    results = []

    # ── Engine Oil ─────────────────────────────────────────────────────────
    oil_prob    = float(np.clip(_MODELS["engine_oil"].predict(feats)[0], 0, 1))
    oil_urgency = _prob_to_urgency(oil_prob)
    oil_exp_key = oil_urgency if oil_urgency in EXPLANATIONS["engine_oil"] else "good"
    results.append({
        "component": "engine_oil", "label": "Engine Oil",
        "health_score": _prob_to_health(oil_prob),
        "urgency": oil_urgency,
        "maintenance_probability": round(oil_prob * 100, 1),
        "predicted_service_window_days": _prob_to_days(oil_prob),
        "explanation": EXPLANATIONS["engine_oil"][oil_exp_key].format(mileage_since_change=km_oil),
        "estimated_cost_min": COST_ESTIMATES["engine_oil"][0],
        "estimated_cost_max": COST_ESTIMATES["engine_oil"][1],
        "shap_factors": [
            {"factor": "km since oil change", "value": round(km_oil), "impact": "high"},
            {"factor": "days since oil change", "value": round(days_oil), "impact": "medium"},
        ],
    })

    # ── Battery ────────────────────────────────────────────────────────────
    bat_prob    = float(np.clip(_MODELS["battery"].predict(feats)[0], 0, 1))
    bat_urgency = _prob_to_urgency(bat_prob)
    bat_exp_key = bat_urgency if bat_urgency in EXPLANATIONS["battery"] else "good"
    results.append({
        "component": "battery", "label": "Battery",
        "health_score": _prob_to_health(bat_prob),
        "urgency": bat_urgency,
        "maintenance_probability": round(bat_prob * 100, 1),
        "predicted_service_window_days": _prob_to_days(bat_prob),
        "explanation": EXPLANATIONS["battery"][bat_exp_key].format(battery_age=battery_age),
        "estimated_cost_min": COST_ESTIMATES["battery"][0],
        "estimated_cost_max": COST_ESTIMATES["battery"][1],
        "shap_factors": [
            {"factor": "battery age (months)", "value": battery_age, "impact": "high"},
            {"factor": "battery voltage (V)", "value": bat_v, "impact": "high"},
        ],
    })

    # ── Brakes ─────────────────────────────────────────────────────────────
    brk_prob    = float(np.clip(_MODELS["brakes"].predict(feats)[0], 0, 1))
    if has_braking and brk_prob < 0.70:
        brk_prob = max(brk_prob, 0.72)
    brk_urgency = _prob_to_urgency(brk_prob)
    brk_exp_key = brk_urgency if brk_urgency in EXPLANATIONS["brakes"] else "good"
    results.append({
        "component": "brakes", "label": "Brakes",
        "health_score": _prob_to_health(brk_prob),
        "urgency": brk_urgency,
        "maintenance_probability": round(brk_prob * 100, 1),
        "predicted_service_window_days": _prob_to_days(brk_prob),
        "explanation": EXPLANATIONS["brakes"][brk_exp_key],
        "estimated_cost_min": COST_ESTIMATES["brakes"][0],
        "estimated_cost_max": COST_ESTIMATES["brakes"][1],
        "shap_factors": [
            {"factor": "brake condition", "value": brake_condition, "impact": "high"},
            {"factor": "braking issues reported", "value": has_braking, "impact": "high"},
        ],
    })

    # ── Tyres ──────────────────────────────────────────────────────────────
    tyre_prob    = float(np.clip(_MODELS["tyres"].predict(feats)[0], 0, 1))
    tyre_urgency = _prob_to_urgency(tyre_prob)
    tyre_exp_key = "warning" if tyre_urgency in ("warning", "critical") else "good"
    results.append({
        "component": "tyres", "label": "Tyres",
        "health_score": _prob_to_health(tyre_prob),
        "urgency": tyre_urgency,
        "maintenance_probability": round(tyre_prob * 100, 1),
        "predicted_service_window_days": _prob_to_days(tyre_prob),
        "explanation": EXPLANATIONS["tyres"][tyre_exp_key].format(mileage_km=mileage),
        "estimated_cost_min": COST_ESTIMATES["tyres"][0],
        "estimated_cost_max": COST_ESTIMATES["tyres"][1],
        "shap_factors": [
            {"factor": "total mileage (km)", "value": mileage, "impact": "medium"},
        ],
    })

    # ── Engine (OBD/DTC) ───────────────────────────────────────────────────
    if has_dtc or eng_temp > 100 or has_noise:
        eng_prob    = float(np.clip(_MODELS["engine"].predict(feats)[0], 0, 1))
        if has_dtc: eng_prob = max(eng_prob, 0.45)
        if eng_temp > 115: eng_prob = max(eng_prob, 0.75)
        eng_urgency = _prob_to_urgency(eng_prob)
        eng_exp_key = eng_urgency if eng_urgency in EXPLANATIONS["engine"] else "good"
        results.append({
            "component": "engine", "label": "Engine",
            "health_score": _prob_to_health(eng_prob),
            "urgency": eng_urgency,
            "maintenance_probability": round(eng_prob * 100, 1),
            "predicted_service_window_days": _prob_to_days(eng_prob),
            "explanation": EXPLANATIONS["engine"][eng_exp_key],
            "estimated_cost_min": COST_ESTIMATES["engine"][0],
            "estimated_cost_max": COST_ESTIMATES["engine"][1],
            "shap_factors": [
                {"factor": "fault codes (DTC)", "value": has_dtc, "impact": "high"},
                {"factor": "engine temp (°C)", "value": eng_temp, "impact": "high"},
            ],
        })

    # ── Fuel System ────────────────────────────────────────────────────────
    if fuel_eff is not None:
        fuel_prob    = float(np.clip(_MODELS["fuel_system"].predict(feats)[0], 0, 1))
        fuel_urgency = _prob_to_urgency(fuel_prob)
        fuel_exp_key = "warning" if fuel_urgency in ("warning", "critical") else "good"
        results.append({
            "component": "fuel_system", "label": "Fuel System",
            "health_score": _prob_to_health(fuel_prob),
            "urgency": fuel_urgency,
            "maintenance_probability": round(fuel_prob * 100, 1),
            "predicted_service_window_days": _prob_to_days(fuel_prob),
            "explanation": EXPLANATIONS["fuel_system"][fuel_exp_key].format(fuel_eff=fuel_eff),
            "estimated_cost_min": COST_ESTIMATES["fuel_system"][0],
            "estimated_cost_max": COST_ESTIMATES["fuel_system"][1],
            "shap_factors": [
                {"factor": "fuel efficiency (km/l)", "value": fuel_eff, "impact": "high"},
            ],
        })

    # ── Transmission ───────────────────────────────────────────────────────
    if has_vibration or mileage > 80_000:
        trans_prob = 0.55 if (has_vibration and mileage > 100_000) else 0.42 if has_vibration else 0.35
        trans_prob = float(np.clip(trans_prob + np.random.uniform(-0.03, 0.03), 0, 1))
        trans_urgency = _prob_to_urgency(trans_prob)
        trans_exp_key = "warning" if trans_urgency in ("warning", "critical") else "good"
        results.append({
            "component": "transmission", "label": "Transmission",
            "health_score": _prob_to_health(trans_prob),
            "urgency": trans_urgency,
            "maintenance_probability": round(trans_prob * 100, 1),
            "predicted_service_window_days": _prob_to_days(trans_prob),
            "explanation": EXPLANATIONS["transmission"][trans_exp_key].format(mileage_km=mileage),
            "estimated_cost_min": COST_ESTIMATES["transmission"][0],
            "estimated_cost_max": COST_ESTIMATES["transmission"][1],
            "shap_factors": [
                {"factor": "vibration reported", "value": has_vibration, "impact": "high"},
                {"factor": "total mileage (km)", "value": mileage, "impact": "medium"},
            ],
        })

    # ── Spark Plugs ────────────────────────────────────────────────────────
    if vehicle_age > 3 or mileage > 40_000:
        sp_prob = min(0.30 + (vehicle_age / 15) * 0.45 + (mileage / 200_000) * 0.25, 0.95)
        sp_urgency = _prob_to_urgency(sp_prob)
        sp_exp_key = "warning" if sp_urgency in ("warning", "critical") else "good"
        results.append({
            "component": "spark_plugs", "label": "Spark Plugs",
            "health_score": _prob_to_health(sp_prob),
            "urgency": sp_urgency,
            "maintenance_probability": round(sp_prob * 100, 1),
            "predicted_service_window_days": _prob_to_days(sp_prob),
            "explanation": EXPLANATIONS["spark_plugs"][sp_exp_key].format(vehicle_age=vehicle_age),
            "estimated_cost_min": COST_ESTIMATES["spark_plugs"][0],
            "estimated_cost_max": COST_ESTIMATES["spark_plugs"][1],
            "shap_factors": [
                {"factor": "vehicle age (years)", "value": vehicle_age, "impact": "medium"},
                {"factor": "total mileage (km)", "value": mileage, "impact": "medium"},
            ],
        })

    urgency_order = {"critical": 0, "warning": 1, "good": 2}
    results.sort(key=lambda x: (urgency_order.get(x["urgency"], 2), -x["maintenance_probability"]))
    return results


def compute_overall_health(components: List[Dict]) -> Dict:
    if not components:
        return {"overall_health_score": 100.0, "overall_status": "good", "top_alert": None}

    scores  = [c["health_score"] for c in components]
    overall = round(float(np.mean(scores)), 1)

    if any(c["urgency"] == "critical" for c in components):
        status = "critical"
    elif any(c["urgency"] == "warning" for c in components):
        status = "warning"
    else:
        status = "good"

    critical = [c["label"] for c in components if c["urgency"] == "critical"]
    warning  = [c["label"] for c in components if c["urgency"] == "warning"]
    top_alert = None
    if critical:
        top_alert = f"Immediate attention required: {', '.join(critical)}"
    elif warning:
        top_alert = f"Service recommended soon: {', '.join(warning[:2])}"

    return {"overall_health_score": overall, "overall_status": status, "top_alert": top_alert}
