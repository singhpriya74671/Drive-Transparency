import numpy as np
from datetime import datetime, timezone
from typing import Dict, List, Any


COST_ESTIMATES = {
    "engine_oil":   (500,  1200),
    "air_filter":   (300,   800),
    "battery":      (2500, 6000),
    "brakes":       (1500, 5000),
    "tyres":        (3000, 8000),
    "coolant":      (400,  1000),
    "transmission": (2000, 8000),
    "spark_plugs":  (600,  1800),
    "fuel_system":  (800,  2500),
}

EXPLANATIONS = {
    "engine_oil": {
        "critical": "Your vehicle has exceeded the recommended oil change interval by {mileage_since_change:.0f} km. Degraded engine oil loses its lubricating properties, which can cause accelerated engine wear and potential long-term damage.",
        "warning":  "Your vehicle is approaching the oil change interval with {mileage_since_change:.0f} km since the last replacement. Scheduling a change soon is strongly recommended to protect engine performance.",
        "good":     "Engine oil is within the acceptable service interval. Only {mileage_since_change:.0f} km since the last oil change.",
    },
    "battery": {
        "critical": "The battery is {battery_age} months old, which exceeds the typical lifespan of 36–48 months. An aged battery is prone to sudden failure, particularly in cold weather or during extended periods of inactivity.",
        "warning":  "The battery is {battery_age} months old and is approaching the end of its recommended service life. A replacement should be planned in the near future to avoid unexpected breakdowns.",
        "good":     "Battery is {battery_age} months old and is currently within its expected service life.",
    },
    "brakes": {
        "critical": "The brake condition is reported as 'poor' and braking issues have been detected. This is a serious safety concern. Immediate inspection and servicing by a qualified technician is required.",
        "warning":  "Brake condition is 'fair' or braking irregularities have been reported. A thorough brake inspection is recommended before the issue worsens.",
        "good":     "Brakes are in good condition with no reported issues.",
    },
    "tyres": {
        "warning":  "Your vehicle has covered {mileage_km:.0f} km. Tyre wear should be inspected — rotation or replacement may be required depending on the tread depth and condition.",
        "good":     "Tyre condition appears satisfactory based on the current mileage.",
    },
    "coolant": {
        "warning":  "Unusual engine noises have been reported, which may indicate a cooling system issue. Coolant level, quality, and the condition of hoses and the radiator should be inspected promptly.",
        "good":     "Cooling system appears to be functioning normally.",
    },
    "fuel_system": {
        "warning":  "Reported fuel efficiency of {fuel_eff:.1f} km/l is below the expected range for your vehicle. This may indicate clogged fuel injectors, a dirty air filter, or other fuel system issues requiring attention.",
        "good":     "Fuel system is operating within normal efficiency parameters.",
    },
    "transmission": {
        "warning":  "Vibrations have been reported and your vehicle has covered {mileage_km:.0f} km. The transmission fluid level and condition should be inspected to rule out early-stage wear.",
        "good":     "Transmission appears to be functioning normally.",
    },
    "spark_plugs": {
        "warning":  "The vehicle is {vehicle_age:.0f} years old. Spark plugs wear over time and can negatively affect engine performance, fuel efficiency, and starting reliability.",
        "good":     "Spark plugs are within the expected service life based on vehicle age and mileage.",
    },
}


def _days_since(dt) -> float:
    if dt is None:
        return 999.0
    now = datetime.now(timezone.utc)
    aware_dt = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return max((now - aware_dt).days, 0)


def predict_maintenance(vehicle_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    mfg_year        = vehicle_data.get("manufacturing_year", 2020)
    mileage         = vehicle_data.get("mileage_km", 0)
    battery_age     = vehicle_data.get("battery_age_months", 0)
    brake_condition = vehicle_data.get("brake_condition", "good")
    fuel_eff        = vehicle_data.get("fuel_efficiency_kmpl")
    last_oil_change = vehicle_data.get("last_oil_change_date")
    has_noise       = vehicle_data.get("has_unusual_noise", False)
    has_vibration   = vehicle_data.get("has_vibration", False)
    has_reduced_mileage = vehicle_data.get("has_reduced_mileage", False)
    has_braking_issues  = vehicle_data.get("has_braking_issues", False)

    vehicle_age_years  = datetime.now(timezone.utc).year - mfg_year
    days_since_oil     = _days_since(last_oil_change)
    km_since_oil_change = min(days_since_oil * 30, mileage)

    results = []

    # Engine Oil
    oil_score, oil_urgency = _score_oil(km_since_oil_change, days_since_oil)
    expl_key = oil_urgency if oil_urgency in EXPLANATIONS["engine_oil"] else "good"
    results.append({
        "component": "engine_oil",
        "label": "Engine Oil",
        "health_score": oil_score,
        "urgency": oil_urgency,
        "explanation": EXPLANATIONS["engine_oil"][expl_key].format(mileage_since_change=km_since_oil_change),
        "estimated_cost_min": COST_ESTIMATES["engine_oil"][0],
        "estimated_cost_max": COST_ESTIMATES["engine_oil"][1],
        "shap_factors": [
            {"factor": "km since last oil change", "value": round(km_since_oil_change), "impact": "high"},
            {"factor": "days since oil change",    "value": round(days_since_oil),      "impact": "medium"},
        ],
    })

    # Battery
    bat_score, bat_urgency = _score_battery(battery_age)
    expl_key = bat_urgency if bat_urgency in EXPLANATIONS["battery"] else "good"
    results.append({
        "component": "battery",
        "label": "Battery",
        "health_score": bat_score,
        "urgency": bat_urgency,
        "explanation": EXPLANATIONS["battery"][expl_key].format(battery_age=battery_age),
        "estimated_cost_min": COST_ESTIMATES["battery"][0],
        "estimated_cost_max": COST_ESTIMATES["battery"][1],
        "shap_factors": [
            {"factor": "battery age (months)", "value": battery_age, "impact": "high"},
        ],
    })

    # Brakes
    brk_score, brk_urgency = _score_brakes(brake_condition, has_braking_issues)
    expl_key = brk_urgency if brk_urgency in EXPLANATIONS["brakes"] else "good"
    results.append({
        "component": "brakes",
        "label": "Brakes",
        "health_score": brk_score,
        "urgency": brk_urgency,
        "explanation": EXPLANATIONS["brakes"][expl_key],
        "estimated_cost_min": COST_ESTIMATES["brakes"][0],
        "estimated_cost_max": COST_ESTIMATES["brakes"][1],
        "shap_factors": [
            {"factor": "brake condition",        "value": brake_condition,    "impact": "high"},
            {"factor": "braking issues reported","value": has_braking_issues, "impact": "high"},
        ],
    })

    # Tyres
    tyre_score, tyre_urgency = _score_tyres(mileage)
    expl_key = "warning" if tyre_urgency == "warning" else "good"
    results.append({
        "component": "tyres",
        "label": "Tyres",
        "health_score": tyre_score,
        "urgency": tyre_urgency,
        "explanation": EXPLANATIONS["tyres"][expl_key].format(mileage_km=mileage),
        "estimated_cost_min": COST_ESTIMATES["tyres"][0],
        "estimated_cost_max": COST_ESTIMATES["tyres"][1],
        "shap_factors": [
            {"factor": "total mileage (km)", "value": mileage, "impact": "medium"},
        ],
    })

    # Fuel System
    if fuel_eff is not None:
        fuel_score, fuel_urgency = _score_fuel(fuel_eff, has_reduced_mileage)
        expl_key = "warning" if fuel_urgency == "warning" else "good"
        results.append({
            "component": "fuel_system",
            "label": "Fuel System",
            "health_score": fuel_score,
            "urgency": fuel_urgency,
            "explanation": EXPLANATIONS["fuel_system"][expl_key].format(fuel_eff=fuel_eff),
            "estimated_cost_min": COST_ESTIMATES["fuel_system"][0],
            "estimated_cost_max": COST_ESTIMATES["fuel_system"][1],
            "shap_factors": [
                {"factor": "fuel efficiency (km/l)",      "value": fuel_eff,          "impact": "high"},
                {"factor": "reduced mileage reported",    "value": has_reduced_mileage, "impact": "medium"},
            ],
        })

    # Coolant
    if has_noise or vehicle_age_years > 5:
        cool_score, cool_urgency = _score_coolant(has_noise, vehicle_age_years)
        expl_key = "warning" if cool_urgency == "warning" else "good"
        results.append({
            "component": "coolant",
            "label": "Coolant System",
            "health_score": cool_score,
            "urgency": cool_urgency,
            "explanation": EXPLANATIONS["coolant"][expl_key],
            "estimated_cost_min": COST_ESTIMATES["coolant"][0],
            "estimated_cost_max": COST_ESTIMATES["coolant"][1],
            "shap_factors": [
                {"factor": "unusual noise reported", "value": has_noise,           "impact": "medium"},
                {"factor": "vehicle age (years)",    "value": vehicle_age_years,   "impact": "low"},
            ],
        })

    # Transmission
    if has_vibration or mileage > 80000:
        trans_score, trans_urgency = _score_transmission(has_vibration, mileage)
        expl_key = "warning" if trans_urgency == "warning" else "good"
        results.append({
            "component": "transmission",
            "label": "Transmission",
            "health_score": trans_score,
            "urgency": trans_urgency,
            "explanation": EXPLANATIONS["transmission"][expl_key].format(mileage_km=mileage),
            "estimated_cost_min": COST_ESTIMATES["transmission"][0],
            "estimated_cost_max": COST_ESTIMATES["transmission"][1],
            "shap_factors": [
                {"factor": "vibration reported",  "value": has_vibration, "impact": "high"},
                {"factor": "total mileage (km)",  "value": mileage,       "impact": "medium"},
            ],
        })

    # Spark Plugs
    if vehicle_age_years > 3 or mileage > 40000:
        sp_score, sp_urgency = _score_spark_plugs(vehicle_age_years, mileage)
        expl_key = "warning" if sp_urgency == "warning" else "good"
        results.append({
            "component": "spark_plugs",
            "label": "Spark Plugs",
            "health_score": sp_score,
            "urgency": sp_urgency,
            "explanation": EXPLANATIONS["spark_plugs"][expl_key].format(vehicle_age=vehicle_age_years),
            "estimated_cost_min": COST_ESTIMATES["spark_plugs"][0],
            "estimated_cost_max": COST_ESTIMATES["spark_plugs"][1],
            "shap_factors": [
                {"factor": "vehicle age (years)", "value": vehicle_age_years, "impact": "medium"},
                {"factor": "total mileage (km)",  "value": mileage,           "impact": "medium"},
            ],
        })

    urgency_order = {"critical": 0, "warning": 1, "good": 2}
    results.sort(key=lambda x: urgency_order.get(x["urgency"], 2))
    return results


def compute_overall_health(components: List[Dict]) -> Dict:
    if not components:
        return {"overall_health_score": 100.0, "overall_status": "good", "top_alert": None}

    scores  = [c["health_score"] for c in components]
    overall = round(np.mean(scores), 1)

    if any(c["urgency"] == "critical" for c in components):
        status = "critical"
    elif any(c["urgency"] == "warning" for c in components):
        status = "warning"
    else:
        status = "good"

    critical_items = [c["label"] for c in components if c["urgency"] == "critical"]
    warning_items  = [c["label"] for c in components if c["urgency"] == "warning"]

    top_alert = None
    if critical_items:
        top_alert = f"Immediate attention required: {', '.join(critical_items)}"
    elif warning_items:
        top_alert = f"Service recommended soon: {', '.join(warning_items[:2])}"

    return {"overall_health_score": overall, "overall_status": status, "top_alert": top_alert}


# --- Individual scoring functions ---

def _score_oil(km_since: float, days: float):
    if km_since > 7000 or days > 180:
        return 20.0, "critical"
    elif km_since > 4000 or days > 90:
        return 55.0, "warning"
    return 90.0, "good"

def _score_battery(age_months: int):
    if age_months >= 48:
        return 15.0, "critical"
    elif age_months >= 36:
        return 50.0, "warning"
    elif age_months >= 24:
        return 70.0, "warning"
    return 90.0, "good"

def _score_brakes(condition: str, has_issues: bool):
    if condition == "poor" or (condition == "fair" and has_issues):
        return 15.0, "critical"
    elif condition == "fair" or has_issues:
        return 55.0, "warning"
    return 92.0, "good"

def _score_tyres(mileage: float):
    if mileage > 50000:
        return 45.0, "warning"
    elif mileage > 30000:
        return 65.0, "warning"
    return 88.0, "good"

def _score_fuel(fuel_eff: float, has_reduced: bool):
    if fuel_eff < 8 or (fuel_eff < 12 and has_reduced):
        return 40.0, "warning"
    return 80.0, "good"

def _score_coolant(has_noise: bool, age_years: int):
    if has_noise and age_years > 5:
        return 45.0, "warning"
    elif has_noise:
        return 60.0, "warning"
    return 78.0, "good"

def _score_transmission(has_vibration: bool, mileage: float):
    if has_vibration and mileage > 100000:
        return 35.0, "warning"
    elif has_vibration:
        return 55.0, "warning"
    return 75.0, "good"

def _score_spark_plugs(age_years: int, mileage: float):
    if age_years > 5 or mileage > 60000:
        return 50.0, "warning"
    return 80.0, "good"
