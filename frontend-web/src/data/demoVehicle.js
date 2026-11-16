import { buildVehicleFromInput } from "./vehicleCatalog";

export function createDemoVehicle() {
  const vehicle = buildVehicleFromInput("BMW X1");
  if (!vehicle) throw new Error("Could not create the sample vehicle profile.");

  return {
    ...vehicle,
    manufacturing_year: 2021,
    mileage_km: 37454,
    fuel_type: "petrol",
    battery_voltage: 11.6,
    engine_temp_c: 105,
    brake_condition: "fair",
    has_dtc: true,
    dtc_codes: "P0300",
    has_vibration: true,
    _demo: true,
  };
}

function component(componentName, label, risk, urgency, explanation, recommendedAction) {
  return {
    component: componentName,
    label,
    health_score: 100 - risk,
    risk_score: risk,
    urgency,
    assessment_source: "demo_sample_rule",
    explanation,
    recommended_action: recommendedAction,
    estimated_cost_min: null,
    estimated_cost_max: null,
    maintenance_probability: null,
    predicted_service_window_days: null,
    shap_factors: null,
  };
}

export function createDemoReport() {
  const components = [
    component(
      "battery",
      "Battery voltage",
      90,
      "critical",
      "Demo sample: 11.6 V is below the 11.8 V critical screening threshold. This reading alone does not confirm battery health.",
      "Have the battery and charging system tested; do not replace parts based on this sample reading alone.",
    ),
    component(
      "engine",
      "Engine / OBD checks",
      70,
      "warning",
      "Demo sample: 105 °C is above the 100 °C monitoring threshold. Fault code P0300 was also entered; its severity and failed part are not inferred.",
      "Check the cooling system and have a technician diagnose P0300 with a compatible OBD-II scanner.",
    ),
    component(
      "brakes",
      "Brakes (reported condition)",
      55,
      "warning",
      "Demo sample: brake condition was self-reported as fair; no wear sensor or physical inspection data is included.",
      "Arrange a professional brake inspection; this self-report does not identify a failed part.",
    ),
    component(
      "reported_symptoms",
      "Reported symptoms",
      55,
      "warning",
      "Demo sample: vibration was reported. A symptom alone does not identify a faulty component.",
      "Have a technician inspect the reported vibration and record a diagnosis before selecting a repair.",
    ),
  ];

  return {
    vehicle_id: 0,
    overall_health_score: 32.5,
    overall_status: "critical",
    components,
    top_alert: "DEMO SAMPLE: illustrative readings flag the battery for prompt testing and other items for inspection.",
    generated_at: new Date().toISOString(),
    service_required: true,
    recommendations: components.map(({ component: name, urgency, recommended_action }) => ({
      component: name,
      urgency,
      action: recommended_action,
    })),
    assessment_method: "demo_sample_threshold_rules",
    model_status: "not_trained",
    model_message: "DEMO ONLY. These illustrative inputs are not live vehicle readings or a trained ML prediction.",
    model_prediction: null,
    assessed_components_count: components.length,
  };
}
