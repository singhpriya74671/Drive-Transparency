export const T = {
  bg:       "#F4F7FB",
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

export function urgencyStyle(urgency) {
  return URGENCY[urgency] || URGENCY.good;
}

export function componentFor(report, ...keys) {
  if (!report?.components) return null;
  return report.components.find((c) => keys.includes(c.component)) || null;
}

export function componentUrgency(report, ...keys) {
  return componentFor(report, ...keys)?.urgency || null;
}

export function overallUrgency(report) {
  if (!report) return null;
  if (report.overall_status === "critical" || report.overall_status === "warning") {
    return report.overall_status;
  }
  return "good";
}

export function temperatureUrgency(vehicle) {
  const temp = Number(vehicle?.engine_temp_c);
  if (!Number.isFinite(temp)) return null;
  if (temp > 110) return "critical";
  if (temp > 100) return "warning";
  return "good";
}

export function voltageUrgency(vehicle) {
  const volts = Number(vehicle?.battery_voltage);
  if (!Number.isFinite(volts)) return null;
  if (volts < 11.8) return "critical";
  if (volts < 12.2) return "warning";
  return "good";
}

export function estimateTyrePressures(report, vehicle) {
  const tyre = componentFor(report, "tyres");
  const health = tyre?.health_score ?? 86;
  const base = health >= 75 ? 32 : health >= 50 ? 30 : 27;
  const front = vehicle?.front_tyre_psi ?? base;
  const rear = vehicle?.rear_tyre_psi ?? base + 1;
  return [
    { position: "Front left", psi: front },
    { position: "Front right", psi: front },
    { position: "Rear left", psi: rear },
    { position: "Rear right", psi: rear },
  ];
}

export function cabinTemperature(vehicle) {
  return Number(vehicle?.cabin_temp_c ?? 24);
}

export function buildSensorStatuses(report, vehicle) {
  const pressure = componentUrgency(report, "tyres");
  const climate = temperatureUrgency(vehicle) || overallUrgency(report);
  const camera = report ? "good" : vehicle ? "warning" : null;
  const radar = report ? "good" : vehicle ? "warning" : null;
  const navigation = report ? "good" : vehicle ? "warning" : null;
  const tyres = estimateTyrePressures(report, vehicle);

  return [
    { key: "pressure",   label: "Pressure",   urgency: pressure,   value: `${tyres[0].psi} PSI`, detail: "TPMS · 4 tyres", tyres },
    { key: "camera",     label: "Camera",     urgency: camera,     value: report ? "Online" : "Standby", detail: "360° vision system" },
    { key: "climate",    label: "Climate",    urgency: climate,    value: `${cabinTemperature(vehicle)}°C`, detail: "Cabin thermal" },
    { key: "navigation", label: "Navigation", urgency: navigation, value: report ? "Active" : "GPS", detail: report ? "Route sync online" : "GPS ready" },
    { key: "radar",      label: "Radar",      urgency: radar,      value: "Active",  detail: "ADAS · collision radar" },
  ];
}

function statusText(urgency) {
  if (urgency === "critical") return "Action needed";
  if (urgency === "warning") return "Create report";
  if (urgency === "good") return "Good";
  return "No data";
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export function buildComponentDetail(key, report, vehicle) {
  const overall = overallUrgency(report) || "good";
  const score = Math.round(report?.overall_health_score ?? 0);
  const pressures = estimateTyrePressures(report, vehicle);
  const battery = componentFor(report, "battery");
  const brakes = componentFor(report, "brakes");
  const tyres = componentFor(report, "tyres");
  const engine = componentFor(report, "engine", "engine_oil", "motor", "transmission");
  const climateUrgency = temperatureUrgency(vehicle) || overall;
  const temp = Number(vehicle?.engine_temp_c ?? 90);
  const rpm = Number(vehicle?.motor_rpm ?? Math.round(1200 + (Number(vehicle?.avg_speed_kmh || 45) / 120) * 6000));
  const hasPackVoltage = vehicle?.pack_voltage != null;
  const packVolts = Number(vehicle?.pack_voltage ?? vehicle?.battery_voltage ?? 12.6);
  const voltageRange = hasPackVoltage ? "300 – 420 V" : "10.0 – 15.0 V";
  const voltageHealth = hasPackVoltage ? (battery?.health_score ?? score) : voltageUrgency(vehicle) === "critical" ? 28 : voltageUrgency(vehicle) === "warning" ? 58 : 92;

  const detail = {
    pressure: {
      title: "Tyre pressure",
      subtitle: "TPMS sensor array",
      icon: "pressure",
      urgency: tyres?.urgency || overall,
      rows: pressures.map((item) => ({ label: item.position, value: `${item.psi} PSI` })),
      note: tyres?.explanation || "All tyre pressures are balanced and within the recommended operating range.",
      health: tyres?.health_score,
    },
    camera: {
      title: "Camera system",
      subtitle: "Surround vision & driver assist",
      icon: "camera",
      urgency: overall,
      rows: [
        { label: "Front camera", value: overall === "good" ? "Online" : "Check required" },
        { label: "Cabin camera", value: "Online" },
        { label: "Side cameras", value: "4 / 4 active" },
        { label: "Vision health", value: `${score}%` },
      ],
      note: "The vision system is streaming clean frames to lane assist, parking and collision detection.",
      health: score,
    },
    climate: {
      title: "Climate control",
      subtitle: "Cabin thermal & HVAC",
      icon: "climate",
      urgency: climateUrgency,
      rows: [
        { label: "Cabin temperature", value: `${cabinTemperature(vehicle)}°C` },
        { label: "Engine temperature", value: `${temp.toFixed(0)}°C` },
        { label: "HVAC mode", value: "Auto" },
        { label: "Air quality", value: "Good" },
      ],
      note: climateUrgency === "good"
        ? "Cabin climate and thermal management are operating within the normal range."
        : "Thermal load is elevated. Monitor coolant levels and schedule a climate system inspection.",
      health: climateUrgency === "good" ? 94 : 62,
    },
    navigation: {
      title: "Navigation",
      subtitle: "GPS & route intelligence",
      icon: "navigation",
      urgency: overall,
      rows: [
        { label: "GPS signal", value: "Locked" },
        { label: "Average speed", value: `${Math.round(Number(vehicle?.avg_speed_kmh ?? 46))} km/h` },
        { label: "Route sync", value: "Active" },
        { label: "Map data", value: "Up to date" },
      ],
      note: "Navigation, live traffic and route guidance are connected and running normally.",
      health: 96,
    },
    radar: {
      title: "Radar & ADAS",
      subtitle: "Collision avoidance sensors",
      icon: "radar",
      urgency: brakes?.urgency || overall,
      rows: [
        { label: "Front radar", value: "Scanning" },
        { label: "Blind spot", value: "Active" },
        { label: "Cruise assist", value: brakes?.urgency === "critical" ? "Limited" : "Ready" },
        { label: "Coverage", value: "360°" },
      ],
      note: brakes?.urgency === "critical"
        ? "ADAS remains active, but brake system inspection is recommended before relying on adaptive cruise."
        : "All collision radar and driver assistance modules are operating normally.",
      health: brakes?.health_score ?? score,
    },
    battery: {
      title: "Battery",
      subtitle: "High-voltage pack & 12V rail",
      icon: "battery",
      urgency: battery?.urgency || overall,
      rows: [
        { label: "State of health", value: battery ? `${Math.round(battery.health_score)}%` : `${score}%` },
        { label: "Pack voltage", value: `${packVolts} V` },
        { label: "12V rail", value: `${Number(vehicle?.battery_voltage ?? 12.6).toFixed(1)} V` },
        { label: "Battery age", value: vehicle?.battery_age_months != null ? `${vehicle.battery_age_months} months` : "--" },
      ],
      note: battery?.explanation || "Battery cells are balanced with stable voltage and normal thermal behaviour.",
      health: battery?.health_score ?? score,
      cost: battery ? `${money(battery.estimated_cost_min)} – ${money(battery.estimated_cost_max)}` : null,
    },
    voltage: {
      title: "Voltage",
      subtitle: "Electrical system & battery rail",
      icon: "voltage",
      urgency: voltageUrgency(vehicle) || battery?.urgency || overall,
      rows: [
        { label: hasPackVoltage ? "Pack voltage" : "Battery voltage", value: `${packVolts} V` },
        { label: "Nominal range", value: voltageRange },
        { label: "12V rail", value: `${Number(vehicle?.battery_voltage ?? 12.6).toFixed(1)} V` },
        { label: "Charging state", value: hasPackVoltage ? "Stable" : voltageUrgency(vehicle) === "good" ? "Normal" : "Check" },
      ],
      note: voltageUrgency(vehicle) === "critical"
        ? "Voltage is below the safe operating threshold. Inspect the battery and charging system before driving."
        : "Electrical output is stable under the current vehicle load with no significant voltage drop detected.",
      health: voltageHealth,
    },
    motor: {
      title: "Motor",
      subtitle: "Drive unit performance",
      icon: "motor",
      urgency: engine?.urgency || overall,
      rows: [
        { label: "Motor RPM", value: rpm.toLocaleString("en-IN") },
        { label: "Motor health", value: engine ? `${Math.round(engine.health_score)}%` : `${score}%` },
        { label: "Runtime", value: vehicle?.engine_runtime_hours != null ? `${Math.round(vehicle.engine_runtime_hours)} hrs` : "--" },
        { label: "Average speed", value: `${Math.round(Number(vehicle?.avg_speed_kmh ?? 46))} km/h` },
      ],
      note: engine?.explanation || "Drive unit is delivering smooth power with stable thermal and RPM behaviour.",
      health: engine?.health_score ?? score,
    },
    brakes: {
      title: "Brake system",
      subtitle: "Safety-critical diagnostics",
      icon: "stop",
      urgency: brakes?.urgency || overall,
      rows: [
        { label: "Brake health", value: brakes ? `${Math.round(brakes.health_score)}%` : "--" },
        { label: "Condition", value: vehicle?.brake_condition || "Good" },
        { label: "Braking issues", value: vehicle?.has_braking_issues ? "Reported" : "None" },
        { label: "Service window", value: brakes?.predicted_service_window_days != null ? `${brakes.predicted_service_window_days} days` : "--" },
      ],
      note: brakes?.explanation || "Brake pads and discs are within the recommended service range.",
      health: brakes?.health_score,
      cost: brakes ? `${money(brakes.estimated_cost_min)} – ${money(brakes.estimated_cost_max)}` : null,
    },
    engine: {
      title: "Engine",
      subtitle: "Powertrain diagnostics",
      icon: "motor",
      urgency: engine?.urgency || overall,
      rows: [
        { label: "Engine health", value: engine ? `${Math.round(engine.health_score)}%` : `${score}%` },
        { label: "Engine temperature", value: `${temp.toFixed(0)}°C` },
        { label: "Fault codes", value: vehicle?.has_dtc ? vehicle?.dtc_codes || "Active" : "None" },
        { label: "Runtime", value: vehicle?.engine_runtime_hours != null ? `${Math.round(vehicle.engine_runtime_hours)} hrs` : "--" },
      ],
      note: engine?.explanation || "Engine operating parameters are within the expected range.",
      health: engine?.health_score,
    },
  };

  const selected = detail[key];
  if (!selected) return null;
  return {
    ...selected,
    status: statusText(selected.urgency),
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
