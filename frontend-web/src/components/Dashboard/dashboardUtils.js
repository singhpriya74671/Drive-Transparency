export const T = {
  bg:       "#FFFFFF",
  card:     "#FFFFFF",
  surface:  "#F8FAFC",
  border:   "#E6ECF3",
  text:     "#0F172A",
  muted:    "#64748B",
  faint:    "#94A3B8",
  blue:     "#2563EB",
  blueSoft: "#EFF6FF",
  cyan:     "#0EA5E9",
  success:  "#10B981",
  warning:  "#F59E0B",
  danger:   "#EF4444",
  shadow:   "0 18px 45px rgba(15, 23, 42, 0.06)",
  shadowSm: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

export const URGENCY = {
  critical: { color: T.danger,  soft: "#FEF2F2", label: "Critical", short: "Critical" },
  warning:  { color: T.warning, soft: "#FFFBEB", label: "Monitor",  short: "Warning"  },
  good:     { color: T.success, soft: "#ECFDF5", label: "Good",     short: "Healthy"  },
};

const UNKNOWN_URGENCY = { color: T.faint, soft: T.surface, label: "Not assessed", short: "No data" };

export function urgencyStyle(urgency) {
  return URGENCY[urgency] || UNKNOWN_URGENCY;
}

export function componentFor(report, ...keys) {
  if (!report?.components) return null;
  return report.components.find((c) => keys.includes(c.component)) || null;
}

export function componentUrgency(report, ...keys) {
  return componentFor(report, ...keys)?.urgency || null;
}

export function overallUrgency(report) {
  if (!report || report.overall_status === "unknown") return null;
  if (report.overall_status === "critical" || report.overall_status === "warning") {
    return report.overall_status;
  }
  return "good";
}

export function measuredValue(vehicle, key) {
  if (!vehicle || (vehicle._manual && !vehicle._demo)) return null;
  const value = vehicle[key];
  return value == null || value === "" ? null : value;
}

export function temperatureUrgency(vehicle) {
  const value = measuredValue(vehicle, "engine_temp_c");
  if (value == null) return null;
  const temp = Number(value);
  if (!Number.isFinite(temp)) return null;
  if (temp > 115) return "critical";
  if (temp > 100) return "warning";
  return "good";
}

export function voltageUrgency(vehicle) {
  const value = measuredValue(vehicle, "battery_voltage");
  if (value == null) return null;
  const volts = Number(value);
  if (!Number.isFinite(volts)) return null;
  if (volts < 11.8) return "critical";
  if (volts < 12.2) return "warning";
  return "good";
}

export function estimateTyrePressures(report, vehicle) {
  return [
    ["Front left", "front_left_tyre_psi"],
    ["Front right", "front_right_tyre_psi"],
    ["Rear left", "rear_left_tyre_psi"],
    ["Rear right", "rear_right_tyre_psi"],
  ].flatMap(([position, key]) => {
    const psi = measuredValue(vehicle, key);
    return psi == null ? [] : [{ position, psi }];
  });
}

export function cabinTemperature(vehicle) {
  const value = measuredValue(vehicle, "cabin_temp_c");
  return value == null ? null : Number(value);
}

export function buildSensorStatuses(report, vehicle) {
  const pressure = componentUrgency(report, "tyres");
  const climate = temperatureUrgency(vehicle);
  const tyres = estimateTyrePressures(report, vehicle);

  return [
    { key: "pressure", label: "Pressure", urgency: pressure, value: tyres.length ? `${tyres.length} readings` : "No data", detail: tyres.length ? "User-provided readings" : "No TPMS readings supplied", tyres },
    { key: "camera", label: "Camera", urgency: null, value: "Not connected", detail: "No camera feed integration" },
    { key: "climate", label: "Engine temp", urgency: climate, value: measuredValue(vehicle, "engine_temp_c") == null ? "No data" : `${measuredValue(vehicle, "engine_temp_c")}°C`, detail: "User-provided reading" },
    { key: "navigation", label: "Navigation", urgency: null, value: "Not connected", detail: "No navigation feed integration" },
    { key: "radar", label: "Radar", urgency: null, value: "Not connected", detail: "No ADAS feed integration" },
  ];
}

function statusText(urgency) {
  if (urgency === "critical") return "Action needed";
  if (urgency === "warning") return "Create report";
  if (urgency === "good") return "Good";
  return "No data";
}

export function buildComponentDetail(key, report, vehicle) {
  const pressures = estimateTyrePressures(report, vehicle);
  const battery = componentFor(report, "battery");
  const brakes = componentFor(report, "brakes");
  const tyres = componentFor(report, "tyres");
  const engine = componentFor(report, "engine", "engine_oil", "motor", "transmission");
  const symptoms = componentFor(report, "reported_symptoms");
  const climateUrgency = temperatureUrgency(vehicle);
  const tempValue = measuredValue(vehicle, "engine_temp_c");
  const temp = tempValue == null ? null : Number(tempValue);
  const rpmValue = measuredValue(vehicle, "motor_rpm");
  const rpm = rpmValue == null ? null : Number(rpmValue);
  const packVoltageValue = measuredValue(vehicle, "pack_voltage");
  const voltageValue = measuredValue(vehicle, "battery_voltage");
  const hasPackVoltage = packVoltageValue != null;
  const packVolts = hasPackVoltage ? packVoltageValue : voltageValue;
  const voltageRange = hasPackVoltage ? "300 – 420 V" : "10.0 – 15.0 V";
  const voltageHealth = battery?.health_score ?? null;

  const detail = {
    pressure: {
      title: "Tyre pressure",
      subtitle: "TPMS sensor array",
      icon: "pressure",
      urgency: tyres?.urgency || null,
      rows: pressures.map((item) => ({ label: item.position, value: `${item.psi} PSI` })),
      note: tyres?.explanation || "No tyre-pressure readings are available.",
      health: tyres?.health_score,
    },
    camera: {
      title: "Camera system",
      subtitle: "Surround vision & driver assist",
      icon: "camera",
      urgency: null,
      rows: [
        { label: "Front camera", value: "No feed" },
        { label: "Cabin camera", value: "No feed" },
        { label: "Side cameras", value: "No feed" },
        { label: "Vision health", value: "Not assessed" },
      ],
      note: "Camera status is not available because no camera feed is integrated.",
      health: null,
    },
    climate: {
      title: "Climate control",
      subtitle: "Cabin thermal & HVAC",
      icon: "climate",
      urgency: climateUrgency,
      rows: [
        { label: "Cabin temperature", value: cabinTemperature(vehicle) == null ? "Not provided" : `${cabinTemperature(vehicle)}°C` },
        { label: "Engine temperature", value: temp == null ? "Not provided" : `${temp.toFixed(0)}°C` },
        { label: "HVAC mode", value: "Not connected" },
        { label: "Air quality", value: "Not connected" },
      ],
      note: engine?.explanation || "Only the supplied engine-temperature reading can be screened; cabin climate is not connected.",
      health: engine?.health_score ?? null,
    },
    navigation: {
      title: "Navigation",
      subtitle: "GPS & route intelligence",
      icon: "navigation",
      urgency: null,
      rows: [
        { label: "GPS signal", value: "Not connected" },
        { label: "Average speed", value: measuredValue(vehicle, "avg_speed_kmh") == null ? "Not provided" : `${Math.round(Number(measuredValue(vehicle, "avg_speed_kmh")))} km/h` },
        { label: "Route sync", value: "Not connected" },
        { label: "Map data", value: "Not connected" },
      ],
      note: "Navigation status is not available because no navigation feed is integrated.",
      health: null,
    },
    radar: {
      title: "Radar & ADAS",
      subtitle: "Collision avoidance sensors",
      icon: "radar",
      urgency: brakes?.urgency || null,
      rows: [
        { label: "Front radar", value: "Not connected" },
        { label: "Blind spot", value: "Not connected" },
        { label: "Cruise assist", value: "Not connected" },
        { label: "Coverage", value: "Not connected" },
      ],
      note: "ADAS radar status is not available because no radar feed is integrated.",
      health: null,
    },
    battery: {
      title: "Battery",
      subtitle: "High-voltage pack & 12V rail",
      icon: "battery",
      urgency: battery?.urgency || voltageUrgency(vehicle) || null,
      rows: [
        { label: "Rule-based health", value: battery ? `${Math.round(battery.health_score)}%` : "Not assessed" },
        { label: "Pack voltage", value: hasPackVoltage ? `${packVolts} V` : "Not provided" },
        { label: "12V reading", value: voltageValue == null ? "Not provided" : `${Number(voltageValue).toFixed(1)} V` },
        { label: "Battery age", value: measuredValue(vehicle, "battery_age_months") != null ? `${vehicle.battery_age_months} months` : "Not provided" },
      ],
      note: battery?.explanation || "No battery reading was provided; battery health is not assessed.",
      health: battery?.health_score ?? null,
      cost: null,
    },
    voltage: {
      title: "Voltage",
      subtitle: "Electrical system & battery rail",
      icon: "voltage",
      urgency: voltageUrgency(vehicle) || battery?.urgency || null,
      rows: [
        { label: hasPackVoltage ? "Pack voltage" : "Battery voltage", value: packVolts == null ? "Not provided" : `${packVolts} V` },
        { label: "Nominal range", value: voltageRange },
        { label: "12V reading", value: voltageValue == null ? "Not provided" : `${Number(voltageValue).toFixed(1)} V` },
        { label: "Charging state", value: voltageUrgency(vehicle) ? "Rule checked" : "Not assessed" },
      ],
      note: voltageValue == null
        ? "No voltage reading was provided."
        : battery?.explanation || "This screening checks only the supplied voltage and does not measure charging performance.",
      health: voltageHealth,
    },
    motor: {
      title: "Motor",
      subtitle: "Drive unit performance",
      icon: "motor",
      urgency: engine?.urgency || symptoms?.urgency || null,
      rows: [
        { label: "Motor RPM", value: rpm == null ? "Not provided" : rpm.toLocaleString("en-IN") },
        { label: "Rule-based health", value: engine ? `${Math.round(engine.health_score)}%` : "Not assessed" },
        { label: "Runtime", value: measuredValue(vehicle, "engine_runtime_hours") == null ? "Not provided" : `${Math.round(Number(vehicle.engine_runtime_hours))} hrs` },
        { label: "Average speed", value: measuredValue(vehicle, "avg_speed_kmh") == null ? "Not provided" : `${Math.round(Number(vehicle.avg_speed_kmh))} km/h` },
      ],
      note: engine?.explanation || symptoms?.explanation || "No engine or motor condition assessment is available.",
      health: engine?.health_score ?? null,
    },
    brakes: {
      title: "Brake system",
      subtitle: "Safety-critical diagnostics",
      icon: "stop",
      urgency: brakes?.urgency || null,
      rows: [
        { label: "Brake health", value: brakes ? `${Math.round(brakes.health_score)}%` : "--" },
        { label: "Condition", value: measuredValue(vehicle, "brake_condition") || "Not provided" },
        { label: "Braking issues", value: measuredValue(vehicle, "has_braking_issues") == null ? "Not reported" : vehicle.has_braking_issues ? "Reported" : "None reported" },
        { label: "Service window", value: brakes?.predicted_service_window_days != null ? `${brakes.predicted_service_window_days} days` : "--" },
      ],
      note: brakes?.explanation || "No brake-condition or braking-symptom data was provided.",
      health: brakes?.health_score,
      cost: null,
    },
    engine: {
      title: "Engine",
      subtitle: "Powertrain diagnostics",
      icon: "motor",
      urgency: engine?.urgency || null,
      rows: [
        { label: "Rule-based health", value: engine ? `${Math.round(engine.health_score)}%` : "Not assessed" },
        { label: "Engine temperature", value: temp == null ? "Not provided" : `${temp.toFixed(0)}°C` },
        { label: "Fault codes", value: vehicle?.has_dtc == null ? "Not checked" : vehicle.has_dtc ? vehicle.dtc_codes || "Active" : "None reported" },
        { label: "Runtime", value: measuredValue(vehicle, "engine_runtime_hours") == null ? "Not provided" : `${Math.round(Number(vehicle.engine_runtime_hours))} hrs` },
      ],
      note: engine?.explanation || "No engine temperature or fault-code evidence was provided.",
      health: engine?.health_score,
    },
  };

  const selected = detail[key];
  if (!selected) return null;
  const status = selected.urgency ? statusText(selected.urgency) : "Not assessed";
  return {
    ...selected,
    status,
    ...urgencyStyle(selected.urgency),
  };
}

export function formatNumber(value, options) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
    return "--";
  }
  return Number(value).toLocaleString("en-IN", options);
}

export function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
