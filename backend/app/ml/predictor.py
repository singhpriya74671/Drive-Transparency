import logging
import math
import os
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

MODEL_VERSION = 1
MODEL_TARGET = "service_required"
FEATURE_NAMES = (
    "vehicle_age_years",
    "mileage_km",
    "battery_age_months",
    "battery_voltage",
    "engine_temp_c",
    "fuel_efficiency_kmpl",
    "brake_score",
    "has_dtc",
    "avg_speed_kmh",
    "engine_runtime_hours",
)

_DEFAULT_MODEL_PATH = Path(__file__).parent / "artifacts" / "maintenance_pipeline.joblib"


class ModelArtifactError(RuntimeError):
    """Raised when a configured maintenance model cannot be used safely."""


def _configured_model_path() -> Path:
    return Path(os.getenv("MAINTENANCE_MODEL_PATH", str(_DEFAULT_MODEL_PATH)))


@lru_cache(maxsize=4)
def _load_model(path: str) -> Optional[Dict[str, Any]]:
    model_path = Path(path)
    if not model_path.is_file():
        return None

    try:
        import joblib

        artifact = joblib.load(model_path)
    except Exception as exc:
        logger.exception("Could not load maintenance model artifact at %s", model_path)
        raise ModelArtifactError("The maintenance model artifact could not be loaded.") from exc

    if not isinstance(artifact, dict):
        raise ModelArtifactError("The maintenance model artifact has an invalid format.")
    if artifact.get("model_version") != MODEL_VERSION:
        raise ModelArtifactError("The maintenance model artifact version is unsupported.")
    if artifact.get("target") != MODEL_TARGET:
        raise ModelArtifactError("The maintenance model artifact target does not match.")
    if tuple(artifact.get("feature_names", ())) != FEATURE_NAMES:
        raise ModelArtifactError("The maintenance model feature schema does not match.")
    pipeline = artifact.get("pipeline")
    if not callable(getattr(pipeline, "predict", None)):
        raise ModelArtifactError("The maintenance model artifact has no prediction pipeline.")
    return artifact


def _trained_model() -> Optional[Dict[str, Any]]:
    return _load_model(str(_configured_model_path()))


def _number(value: Any) -> Optional[float]:
    if value is None or value == "":
        return None
    result = float(value)
    if not math.isfinite(result):
        raise ValueError("Numeric vehicle readings must be finite values.")
    return result


def _model_features(vehicle: Dict[str, Any]) -> Dict[str, Optional[float]]:
    year = vehicle.get("manufacturing_year")
    vehicle_age = None if year is None else max(datetime.now(timezone.utc).year - int(year), 0)
    brake_score = {"good": 90.0, "fair": 50.0, "poor": 15.0}.get(vehicle.get("brake_condition"))
    dtc_codes = str(vehicle.get("dtc_codes") or "").strip()
    has_dtc = vehicle.get("has_dtc")
    if dtc_codes:
        has_dtc = True

    return {
        "vehicle_age_years": vehicle_age,
        "mileage_km": _number(vehicle.get("mileage_km")),
        "battery_age_months": _number(vehicle.get("battery_age_months")),
        "battery_voltage": _number(vehicle.get("battery_voltage")),
        "engine_temp_c": _number(vehicle.get("engine_temp_c")),
        "fuel_efficiency_kmpl": _number(vehicle.get("fuel_efficiency_kmpl")),
        "brake_score": brake_score,
        "has_dtc": None if has_dtc is None else float(bool(has_dtc)),
        "avg_speed_kmh": _number(vehicle.get("avg_speed_kmh")),
        "engine_runtime_hours": _number(vehicle.get("engine_runtime_hours")),
    }


def _status_for_risk(risk_score: int) -> str:
    if risk_score >= 80:
        return "critical"
    if risk_score >= 40:
        return "warning"
    return "good"


def _component(
    component: str,
    label: str,
    risk_score: int,
    explanation: str,
    recommended_action: str,
) -> Dict[str, Any]:
    urgency = _status_for_risk(risk_score)
    return {
        "component": component,
        "label": label,
        "health_score": 100 - risk_score,
        "risk_score": risk_score,
        "urgency": urgency,
        "assessment_source": "threshold_rule",
        "explanation": explanation,
        "recommended_action": recommended_action,
        "estimated_cost_min": None,
        "estimated_cost_max": None,
        "maintenance_probability": None,
        "predicted_service_window_days": None,
        "shap_factors": None,
    }


def _rule_assessments(vehicle: Dict[str, Any]) -> List[Dict[str, Any]]:
    results: List[Dict[str, Any]] = []

    voltage = _number(vehicle.get("battery_voltage"))
    if voltage is not None:
        if voltage < 11.8:
            results.append(_component(
                "battery", "Battery voltage", 90,
                f"Reported voltage is {voltage:.1f} V, below the 11.8 V critical screening threshold.",
                "Have the battery and charging system tested promptly; do not replace parts based on voltage alone.",
            ))
        elif voltage < 12.2:
            results.append(_component(
                "battery", "Battery voltage", 55,
                f"Reported voltage is {voltage:.1f} V, below the 12.2 V monitoring threshold.",
                "Recheck voltage under the vehicle manufacturer's specified conditions and arrange a battery test if it remains low.",
            ))
        else:
            results.append(_component(
                "battery", "Battery voltage", 10,
                f"Reported voltage is {voltage:.1f} V; it does not cross this application's low-voltage thresholds. This does not measure battery state of health.",
                "No service is indicated by this voltage reading alone; use the vehicle manufacturer's test procedure for battery health.",
            ))

    engine_signals: List[tuple] = []
    temperature = _number(vehicle.get("engine_temp_c"))
    if temperature is not None:
        if temperature > 115:
            engine_signals.append((
                90,
                f"Reported engine temperature is {temperature:.0f} °C, above the 115 °C critical screening threshold.",
                "Stop safely if the vehicle is overheating and have the cooling system inspected before continuing.",
            ))
        elif temperature > 100:
            engine_signals.append((
                60,
                f"Reported engine temperature is {temperature:.0f} °C, above the 100 °C monitoring threshold.",
                "Monitor the temperature and check the cooling system against the vehicle manufacturer's specifications.",
            ))
        else:
            engine_signals.append((
                10,
                f"Reported engine temperature is {temperature:.0f} °C and does not cross this application's high-temperature thresholds; other engine conditions are not assessed.",
                "No action is indicated by this temperature reading alone.",
            ))

    dtc_codes = str(vehicle.get("dtc_codes") or "").strip()
    has_dtc = vehicle.get("has_dtc") is True or bool(dtc_codes)
    if has_dtc:
        code_text = f" ({dtc_codes})" if dtc_codes else ""
        engine_signals.append((
            70,
            f"An active diagnostic trouble code was reported{code_text}; the code's severity and failed part are not inferred.",
            "Read and diagnose the code with a compatible OBD-II scanner before replacing components.",
        ))

    if engine_signals:
        risk = max(signal[0] for signal in engine_signals)
        results.append(_component(
            "engine", "Engine / OBD checks", risk,
            " ".join(signal[1] for signal in engine_signals),
            " ".join(dict.fromkeys(signal[2] for signal in engine_signals)),
        ))

    brake_condition = vehicle.get("brake_condition")
    braking_issues = vehicle.get("has_braking_issues") is True
    if brake_condition is not None or braking_issues:
        if braking_issues or brake_condition == "poor":
            risk = 90
            explanation = "Braking trouble was reported." if braking_issues else "Brake condition was self-reported as poor."
            action = "Avoid driving if braking is impaired and arrange an immediate professional brake inspection."
        elif brake_condition == "fair":
            risk = 55
            explanation = "Brake condition was self-reported as fair; no wear sensor or physical inspection data was supplied."
            action = "Arrange a brake inspection; this self-report does not identify a failed part."
        else:
            risk = 10
            explanation = "Brake condition was self-reported as good; brake wear was not measured."
            action = "No action is indicated by this self-report alone; follow the vehicle's inspection schedule."
        results.append(_component("brakes", "Brakes (reported condition)", risk, explanation, action))

    symptoms = []
    if vehicle.get("has_unusual_noise") is True:
        symptoms.append("unusual noise")
    if vehicle.get("has_vibration") is True:
        symptoms.append("vibration")
    if vehicle.get("has_reduced_mileage") is True:
        symptoms.append("reduced mileage")
    extra_symptoms = str(vehicle.get("additional_symptoms") or "").strip()
    if extra_symptoms:
        symptoms.append(f"other reported symptoms: {extra_symptoms}")

    if symptoms:
        results.append(_component(
            "reported_symptoms", "Reported symptoms", 55,
            "Reported: " + "; ".join(symptoms) + ". Symptoms alone do not identify a faulty component.",
            "Have a technician inspect the reported symptoms and record a diagnosis before selecting a repair.",
        ))

    return results


def _model_prediction(vehicle: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    artifact = _trained_model()
    if artifact is None:
        return None

    import pandas as pd

    features = _model_features(vehicle)
    row = pd.DataFrame([{name: features[name] for name in FEATURE_NAMES}], columns=FEATURE_NAMES)
    pipeline = artifact["pipeline"]
    predicted = bool(pipeline.predict(row)[0])
    prediction: Dict[str, Any] = {
        "target": MODEL_TARGET,
        "predicted_class": int(predicted),
        "service_required": predicted,
    }

    predict_proba = getattr(pipeline, "predict_proba", None)
    if callable(predict_proba):
        probabilities = predict_proba(row)[0]
        classes = list(getattr(pipeline, "classes_", [0, 1]))
        positive_index = classes.index(1) if 1 in classes else None
        if positive_index is not None:
            prediction["probability_service_required"] = round(float(probabilities[positive_index]), 4)

    return prediction


def predict_maintenance(vehicle_data: Dict[str, Any]) -> Dict[str, Any]:
    components = _rule_assessments(vehicle_data)
    model_prediction = _model_prediction(vehicle_data)

    risks = [component["risk_score"] for component in components]
    overall_score = round(sum(100 - risk for risk in risks) / len(risks), 1) if risks else None
    if any(component["urgency"] == "critical" for component in components):
        overall_status = "critical"
    elif any(component["urgency"] == "warning" for component in components):
        overall_status = "warning"
    elif components:
        overall_status = "good"
    else:
        overall_status = "unknown"

    rule_service_required = None if not components else overall_status in ("critical", "warning")
    service_required = (
        rule_service_required
        if model_prediction is None
        else bool(model_prediction["service_required"]) or rule_service_required is True
    )

    issues = [component for component in components if component["urgency"] in ("critical", "warning")]
    if issues:
        top_alert = "Reported conditions need attention: " + ", ".join(component["label"] for component in issues)
    elif components:
        top_alert = "No configured screening threshold was crossed; this is not a full vehicle inspection."
    else:
        top_alert = "No supported readings or symptoms were supplied; vehicle health cannot be assessed."

    recommendations = [
        {
            "component": component["component"],
            "urgency": component["urgency"],
            "action": component["recommended_action"],
        }
        for component in components
        if component["urgency"] != "good"
    ]

    model_available = model_prediction is not None
    return {
        "components": components,
        "overall_health_score": overall_score,
        "overall_status": overall_status,
        "service_required": service_required,
        "top_alert": top_alert,
        "recommendations": recommendations,
        "assessment_method": "threshold_rules_and_supervised_model" if model_available else "threshold_rules",
        "model_status": "available" if model_available else "not_trained",
        "model_message": None if model_available else (
            "No trained maintenance model is installed. Results are limited to the documented rules shown; "
            "a labeled service_required dataset is required for ML predictions."
        ),
        "model_prediction": model_prediction,
        "assessed_components_count": len(components),
    }


def compute_overall_health(components: List[Dict[str, Any]]) -> Dict[str, Any]:
    if not components:
        return {"overall_health_score": None, "overall_status": "unknown", "top_alert": None}

    scores = [component["health_score"] for component in components]
    overall = round(sum(scores) / len(scores), 1)
    critical = [component["label"] for component in components if component["urgency"] == "critical"]
    warning = [component["label"] for component in components if component["urgency"] == "warning"]
    status = "critical" if critical else "warning" if warning else "good"
    top_alert = (
        f"Immediate attention required: {', '.join(critical)}" if critical
        else f"Inspection recommended: {', '.join(warning)}" if warning
        else "No configured screening threshold was crossed; this is not a full vehicle inspection."
    )
    return {"overall_health_score": overall, "overall_status": status, "top_alert": top_alert}
