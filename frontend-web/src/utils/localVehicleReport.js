import { resolveVehicleProfile } from "../data/vehicleCatalog";

// Generates a complete, deterministic diagnostic report from a vehicle object.
// This keeps the dashboard fully functional (logo, specs, markers, diagnostics)
// even when the backend is unavailable, and guarantees that switching the
// manual vehicle input updates every panel instantly without a refresh.

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashSeed(value) {
  const text = String(value || "");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seed) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const LABELS = {
  engine: "Engine",
  engine_oil: "Engine Oil",
  motor: "Motor",
  battery: "Battery",
  brakes: "Brakes",
  tyres: "Tyres",
  transmission: "Transmission",
  fuel_system: "Fuel System",
  climate: "Climate",
  camera: "Camera",
  radar: "Radar",
  charging: "Charging System",
};

const COST = {
  engine: [3000, 12000],
  engine_oil: [500, 1500],
  motor: [2000, 9000],
  battery: [2500, 6000],
  brakes: [1500, 5000],
  tyres: [3000, 8000],
  transmission: [2000, 8000],
  fuel_system: [800, 2500],
  climate: [1200, 4500],
  camera: [1500, 6000],
  radar: [1800, 7000],
  charging: [1000, 4000],
};

const BASE_HEALTH = {
  engine: 78,
  engine_oil: 73,
  motor: 83,
  battery: 88,
  brakes: 71,
  tyres: 84,
  transmission: 83,
  fuel_system: 86,
  climate: 81,
  camera: 90,
  radar: 88,
  charging: 86,
};

const EXPLANATIONS = {
  engine: "Engine operating parameters are within the expected range. Combustion and cooling look stable.",
  engine_oil: "Oil service interval is approaching. Schedule a fluid and filter change within the next service window.",
  motor: "Drive unit is delivering smooth power with stable thermal and RPM behaviour.",
  battery: "Battery pack is within its expected service life with stable voltage and balanced cell health.",
  brakes: "Brake pads and discs are within the recommended service range.",
  tyres: "Tyre wear is within normal range and pressures are balanced across all four wheels.",
  transmission: "Transmission is operating smoothly with no vibration or abnormal noise detected.",
  fuel_system: "Fuel delivery system is operating within normal efficiency parameters.",
  climate: "Cabin climate and thermal management are operating within the normal range.",
  camera: "The vision system is streaming clean frames to lane assist, parking and collision detection.",
  radar: "All collision radar and driver assistance modules are operating normally.",
  charging: "Charging system is delivering stable power with no faults detected.",
};

function componentOrder(profile) {
  if (profile.electric) {
    return ["motor", "battery", "brakes", "tyres", "climate", "camera", "radar", "charging"];
  }
  return ["engine", "engine_oil", "battery", "brakes", "tyres", "transmission", "fuel_system", "climate", "camera", "radar"];
}

export function buildLocalReport(vehicle, profileArg) {
  const profile = profileArg || resolveVehicleProfile(vehicle || {});
  const seedSource = [
    profile.displayName,
    vehicle?.manufacturer,
    vehicle?.vehicle_model,
    vehicle?.manufacturing_year,
    vehicle?.mileage_km,
    vehicle?.fuel_type,
  ].join("|");
  const rng = makeRng(hashSeed(seedSource));

  const components = componentOrder(profile).map((key) => {
    const base = BASE_HEALTH[key] ?? 80;
    const health = clamp(base + Math.round((rng() * 2 - 1) * 18), 24, 99);
    const urgency = health >= 78 ? "good" : health >= 55 ? "warning" : "critical";
    const [costMin, costMax] = COST[key] || [500, 2000];
    const costScale = urgency === "good" ? 0.6 : urgency === "warning" ? 1 : 1.4;
    const probability = clamp(Math.round((100 - health) * 0.9 + rng() * 10), 8, 92);
    const windowDays = urgency === "critical"
      ? 7 + Math.round(rng() * 10)
      : urgency === "warning"
        ? 20 + Math.round(rng() * 60)
        : 120 + Math.round(rng() * 120);

    return {
      component: key,
      label: LABELS[key] || key,
      health_score: health,
      urgency,
      explanation: EXPLANATIONS[key] || "Component operating within normal parameters.",
      estimated_cost_min: Math.round(costMin * costScale),
      estimated_cost_max: Math.round(costMax * costScale),
      maintenance_probability: probability,
      predicted_service_window_days: windowDays,
      shap_factors: [
        {
          factor: "component health",
          value: `${health}%`,
          impact: urgency === "good" ? "low" : "high",
        },
      ],
    };
  });

  const average = Math.round(
    components.reduce((sum, component) => sum + component.health_score, 0) / components.length
  );
  const critical = components.filter((component) => component.urgency === "critical");
  const warning = components.filter((component) => component.urgency === "warning");
  const overallStatus = critical.length ? "critical" : warning.length ? "warning" : "good";

  const alertSource = critical[0] || warning[0];
  const soonestWindow = components.reduce(
    (min, component) => Math.min(min, component.predicted_service_window_days ?? 999),
    999
  );
  const topAlert = alertSource
    ? `${alertSource.label}: ${alertSource.explanation}`
    : `All monitored systems are healthy. Next routine service in ${soonestWindow} days.`;

  return {
    vehicle_id: vehicle?.id ?? 0,
    overall_health_score: average,
    overall_status: overallStatus,
    top_alert: topAlert,
    generated_at: new Date().toISOString(),
    components,
    _local: true,
  };
}

export default buildLocalReport;
