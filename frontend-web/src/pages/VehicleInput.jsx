import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";
import { useAuth } from "../context/AuthContext";
import { findCatalogEntry, listBrands, listVehicleOptions } from "../data/vehicleCatalog";
import toast from "react-hot-toast";

const BG      = "#FFFFFF";
const CARD    = "#FFFFFF";
const SURFACE = "#F8FAFC";
const PRIMARY = "#2563EB";
const TEXT    = "#0F172A";
const MUTED   = "#64748B";
const BORDER  = "#E2E8F0";

const STEPS = [
  { n: 1, label: "Vehicle Info",      icon: "🚗" },
  { n: 2, label: "Service History",   icon: "🔧" },
  { n: 3, label: "Condition",         icon: "📊" },
  { n: 4, label: "Readings",          icon: "📟" },
  { n: 5, label: "Symptoms",          icon: "⚠️" },
];

const INITIAL = {
  owner_name: "", phone: "", vehicle_model: "", manufacturer: "",
  manufacturing_year: "", fuel_type: "petrol",
  last_service_date: "", last_oil_change_date: "",
  mileage_km: "", battery_age_months: "", brake_condition: "", fuel_efficiency_kmpl: "",
  has_unusual_noise: false, has_vibration: false,
  has_reduced_mileage: false, has_braking_issues: false,
  additional_symptoms: "",
  // OBD-II / Telematics
  battery_voltage: "",
  engine_temp_c: "",
  has_dtc: null,
  dtc_codes: "",
  avg_speed_kmh: "",
  engine_runtime_hours: "",
};

export default function VehicleInput() {
  const { createVehicle, analyzeVehicle, analyzeQuick, setSelected, selectedVehicle, loading } = useVehicle();
  const [form, setForm] = useState(() => {
    if (!selectedVehicle) return INITIAL;
    const savedVehicle = selectedVehicle.id > 0 && !selectedVehicle._manual;
    const model = selectedVehicle.vehicle_model || "";
    const manufacturer = selectedVehicle.manufacturer || "";
    return {
      ...INITIAL,
      vehicle_model: manufacturer && !model.toLowerCase().includes(manufacturer.toLowerCase())
        ? `${manufacturer} ${model}` : model,
      manufacturer,
      ...(selectedVehicle._demo ? {
        manufacturing_year: String(selectedVehicle.manufacturing_year || ""),
        mileage_km: String(selectedVehicle.mileage_km ?? ""),
        fuel_type: selectedVehicle.fuel_type || "petrol",
        battery_voltage: String(selectedVehicle.battery_voltage ?? ""),
        engine_temp_c: String(selectedVehicle.engine_temp_c ?? ""),
        brake_condition: selectedVehicle.brake_condition || "",
        has_dtc: selectedVehicle.has_dtc ?? null,
        dtc_codes: selectedVehicle.dtc_codes || "",
        has_vibration: selectedVehicle.has_vibration === true,
      } : savedVehicle ? {
        manufacturing_year: String(selectedVehicle.manufacturing_year || ""),
        mileage_km: String(selectedVehicle.mileage_km ?? ""),
        fuel_type: selectedVehicle.fuel_type || "petrol",
      } : {}),
    };
  });
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();
  const vehicleOptions = useMemo(() => listVehicleOptions(), []);
  const brandOptions = useMemo(() => listBrands(), []);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleVehicleModelChange = (value) => {
    set("vehicle_model", value);
    const match = findCatalogEntry(value);
    if (match) {
      const brand = brandOptions.find((b) => b.key === match.brandKey)?.name || "";
      if (brand && !form.manufacturer) set("manufacturer", brand);
      if (match.electric && form.fuel_type !== "electric") set("fuel_type", "electric");
    }
  };

  const buildPayload = () => {
    const optionalNumber = (value) => value === "" || value == null ? null : Number(value);
    return {
      ...form,
      manufacturing_year: optionalNumber(form.manufacturing_year),
      mileage_km: optionalNumber(form.mileage_km),
      battery_age_months: optionalNumber(form.battery_age_months),
      brake_condition: form.brake_condition || null,
      fuel_efficiency_kmpl: optionalNumber(form.fuel_efficiency_kmpl),
      last_service_date: form.last_service_date || null,
      last_oil_change_date: form.last_oil_change_date || null,
      battery_voltage: optionalNumber(form.battery_voltage),
      engine_temp_c: optionalNumber(form.engine_temp_c),
      has_dtc: form.has_dtc,
      avg_speed_kmh: optionalNumber(form.avg_speed_kmh),
      engine_runtime_hours: optionalNumber(form.engine_runtime_hours),
      dtc_codes: form.dtc_codes.trim() || null,
      additional_symptoms: form.additional_symptoms.trim() || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = buildPayload();
      if (!payload.owner_name?.trim() || !payload.vehicle_model?.trim() || payload.manufacturing_year == null) {
        setStep(1);
        toast.error("Add your name, vehicle model, and manufacturing year before saving.");
        return;
      }
      if (payload.mileage_km == null) {
        setStep(3);
        toast.error("Add the vehicle mileage before saving.");
        return;
      }
      const vehicle = await createVehicle(payload);
      setSelected({ ...payload, ...vehicle });
      const result  = await analyzeVehicle(vehicle.id);
      if (result) navigate("/diagnostics");
    } catch {
      // individual toasts already shown by createVehicle / analyzeVehicle
    }
  };

  const handleQuick = async () => {
    try {
      const payload = buildPayload();
      const hasSupportedInput = payload.battery_voltage != null
        || payload.engine_temp_c != null
        || payload.brake_condition != null
        || payload.has_dtc === true
        || Boolean(payload.dtc_codes)
        || payload.has_unusual_noise
        || payload.has_vibration
        || payload.has_reduced_mileage
        || payload.has_braking_issues
        || Boolean(payload.additional_symptoms);
      if (!hasSupportedInput) {
        setStep(4);
        toast.error("Enter a measured reading, brake condition, active fault code, or symptom before running a check.");
        return;
      }
      const result = await analyzeQuick(payload);
      if (result) {
        setSelected({ ...payload, id: 0, _unsaved: true });
        navigate("/diagnostics");
      }
    } catch {
      // The context displays the API error; do not replace it with a local report.
    }
  };

  const voltageColor = form.battery_voltage === "" ? MUTED : form.battery_voltage < 11.8 ? "#EF4444" : form.battery_voltage < 12.2 ? "#F59E0B" : "#10B981";
  const tempColor    = form.engine_temp_c === "" ? MUTED : form.engine_temp_c > 115 ? "#EF4444" : form.engine_temp_c > 100 ? "#F59E0B" : "#10B981";

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-1" style={{ color: TEXT }}>Vehicle Analysis</h1>
          <p className="text-sm" style={{ color: MUTED }}>
            {user ? `Welcome, ${user.name} — ` : ""}
            Enter any readings or symptoms you know, then run a rule-based screening check.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-5" style={{ color: MUTED }}>
            Start with vehicle details, use Continue to move through the sections, then choose Quick Check on the final step.
            No live OBD sensor is connected; only the readings and symptoms you enter can be assessed.
          </p>
          <p className="mx-auto mt-1 max-w-xl text-xs leading-5" style={{ color: MUTED }}>
            Results appear on Diagnostics after checking. The backend service must be running; if it is stopped, no report can be returned.
          </p>
          {selectedVehicle?._demo && (
            <p role="note" className="mx-auto mt-2 max-w-xl rounded-lg border px-3 py-2 text-xs leading-5"
              style={{ borderColor: "#FCD34D", background: "#FFFBEB", color: "#78350F" }}>
              DEMO SAMPLE VALUES are prefilled below. They are illustrative only; replace them with actual readings before using Quick Check.
            </p>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-0 mt-6 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={{
                      background: step >= s.n ? PRIMARY    : SURFACE,
                      color:      step >= s.n ? BG         : MUTED,
                      border:     step === s.n ? `2px solid ${PRIMARY}` : "2px solid transparent",
                    }}
                  >
                    {step > s.n ? "✓" : s.n}
                  </div>
                  <span className="text-xs hidden sm:block" style={{ color: step >= s.n ? PRIMARY : MUTED }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-0.5 w-8 sm:w-12 mb-4 mx-1 transition-all flex-shrink-0"
                    style={{ background: step > s.n ? PRIMARY : BORDER }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">

            {/* ── Step 1: Vehicle Info ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                <SectionCard title="Basic Information" icon="🚗">
                  <Row>
                    <Field label="Owner Name *">
                      <input className="fi" placeholder="Your full name" value={form.owner_name} onChange={e => set("owner_name", e.target.value)} required />
                    </Field>
                    <Field label="Phone">
                      <input className="fi" placeholder="Mobile number" value={form.phone} onChange={e => set("phone", e.target.value)} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Vehicle Model *">
                      <input
                        className="fi"
                        list="vehicle-model-suggestions"
                        placeholder="e.g. Tesla Model Y, BMW X5"
                        value={form.vehicle_model}
                        onChange={e => handleVehicleModelChange(e.target.value)}
                        required
                      />
                      <datalist id="vehicle-model-suggestions">
                        {vehicleOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.bodyLabel}</option>
                        ))}
                      </datalist>
                    </Field>
                    <Field label="Manufacturer">
                      <input
                        className="fi"
                        list="vehicle-brand-suggestions"
                        placeholder="e.g. Tesla, Hyundai"
                        value={form.manufacturer}
                        onChange={e => set("manufacturer", e.target.value)}
                      />
                      <datalist id="vehicle-brand-suggestions">
                        {brandOptions.map((brand) => (
                          <option key={brand.key} value={brand.name} />
                        ))}
                      </datalist>
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Manufacturing Year *">
                      <input className="fi" type="number" min="1990" max="2026" value={form.manufacturing_year} onChange={e => set("manufacturing_year", e.target.value)} required />
                    </Field>
                    <Field label="Fuel Type">
                      <select className="fi" value={form.fuel_type} onChange={e => set("fuel_type", e.target.value)}>
                        <option value="petrol">Petrol</option>
                        <option value="diesel">Diesel</option>
                        <option value="cng">CNG</option>
                        <option value="electric">Electric</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </Field>
                  </Row>
                </SectionCard>
                <BtnRow onNext={() => setStep(2)} />
              </motion.div>
            )}

            {/* ── Step 2: Service History ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                <SectionCard title="Service History" icon="🔧">
                  <p className="text-sm mb-4" style={{ color: MUTED }}>Enter your last service dates so the AI can assess overdue maintenance.</p>
                  <Row>
                    <Field label="Last Full Service Date">
                      <input className="fi" type="date" value={form.last_service_date} onChange={e => set("last_service_date", e.target.value)} />
                    </Field>
                    <Field label="Last Oil Change Date">
                      <input className="fi" type="date" value={form.last_oil_change_date} onChange={e => set("last_oil_change_date", e.target.value)} />
                    </Field>
                  </Row>
                  <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: SURFACE, color: MUTED }}>
                    💡                     Unknown values are left unassessed; they are not treated as faults.
                  </div>
                </SectionCard>
                <BtnRow onBack={() => setStep(1)} onNext={() => setStep(3)} />
              </motion.div>
            )}

            {/* ── Step 3: Current Condition ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                <SectionCard title="Current Vehicle Condition" icon="📊">
                  <Field label="Total Mileage (km) *">
                    <input className="fi" type="number" min="0" placeholder="e.g. 45000" value={form.mileage_km} onChange={e => set("mileage_km", e.target.value)} required />
                  </Field>
                  <Row>
                    <Field label="Battery Age (months)">
                      <input className="fi" type="number" min="0" max="120" value={form.battery_age_months} onChange={e => set("battery_age_months", e.target.value)} />
                    </Field>
                    <Field label="Fuel Efficiency (km/l)">
                      <input className="fi" type="number" min="0" step="0.1" placeholder="e.g. 18.5" value={form.fuel_efficiency_kmpl} onChange={e => set("fuel_efficiency_kmpl", e.target.value)} />
                    </Field>
                  </Row>
                  <Field label="Brake Condition">
                    <select className="fi" value={form.brake_condition} onChange={e => set("brake_condition", e.target.value)}>
                      <option value="">Not assessed</option>
                      <option value="good">Good — Brakes function correctly</option>
                      <option value="fair">Fair — Minor issues noticed</option>
                      <option value="poor">Poor — Noticeable braking problem</option>
                    </select>
                  </Field>
                </SectionCard>
                <BtnRow onBack={() => setStep(2)} onNext={() => setStep(4)} />
              </motion.div>
            )}

            {/* ── Step 4: OBD-II / AI Diagnostics ── */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                <SectionCard title="Measured Readings & Fault Codes" icon="📟">
                  <div className="p-3 rounded-xl text-xs mb-2" style={{ background: `${PRIMARY}15`, border: `1px solid ${PRIMARY}33`, color: MUTED }}>
                    For a rule-based check, enter any observed battery voltage, engine temperature, fault-code status, brake condition, or symptom. Other fields are saved as vehicle details but are not used by the current screening rules. Blank readings are not assumed to be normal.
                  </div>

                  {/* Battery Voltage */}
                  <Field label="Battery Voltage (V, optional)">
                    <div className="space-y-2">
                      <input className="fi" type="number" min="8" max="16" step="0.1"
                        placeholder="Only enter a measured value"
                        value={form.battery_voltage}
                        onChange={e => set("battery_voltage", e.target.value)}
                      />
                      <div className="flex justify-between text-xs" style={{ color: MUTED }}>
                        <span style={{ color: "#EF4444" }}>Below 11.8V: critical</span>
                        <span style={{ color: voltageColor, fontWeight: 600 }}>{form.battery_voltage === "" ? "Not provided" : `${form.battery_voltage}V`}</span>
                        <span style={{ color: "#F59E0B" }}>Below 12.2V: monitor</span>
                      </div>
                      <p className="text-xs" style={{ color: MUTED }}>Voltage screening does not measure battery state of health.</p>
                    </div>
                  </Field>

                  {/* Engine Temperature */}
                  <Field label="Engine Temperature (°C, optional)">
                    <div className="space-y-2">
                      <input className="fi" type="number" min="0" max="250" step="1"
                        placeholder="Only enter a measured value"
                        value={form.engine_temp_c}
                        onChange={e => set("engine_temp_c", e.target.value)}
                      />
                      <div className="flex justify-between text-xs" style={{ color: MUTED }}>
                        <span>Above 100°C: monitor</span>
                        <span style={{ color: tempColor, fontWeight: 600 }}>{form.engine_temp_c === "" ? "Not provided" : `${form.engine_temp_c}°C`}</span>
                        <span style={{ color: "#EF4444" }}>Above 115°C: critical</span>
                      </div>
                      <p className="text-xs" style={{ color: MUTED }}>A single temperature reading does not assess all engine conditions.</p>
                    </div>
                  </Field>

                  <Row>
                    <Field label="Avg Speed (km/h)">
                      <input className="fi" type="number" min="0" max="200" placeholder="e.g. 45"
                        value={form.avg_speed_kmh} onChange={e => set("avg_speed_kmh", e.target.value)} />
                    </Field>
                    <Field label="Engine Runtime (hours)">
                      <input className="fi" type="number" min="0" placeholder="e.g. 1200"
                        value={form.engine_runtime_hours} onChange={e => set("engine_runtime_hours", e.target.value)} />
                    </Field>
                  </Row>

                  {/* Fault Codes */}
                  <Field label="Fault codes status">
                    <select className="fi" value={form.has_dtc == null ? "" : String(form.has_dtc)}
                      onChange={e => set("has_dtc", e.target.value === "" ? null : e.target.value === "true")}>
                      <option value="">Unknown / not checked</option>
                      <option value="false">No active fault codes reported</option>
                      <option value="true">Fault code(s) active</option>
                    </select>
                  </Field>

                  {form.has_dtc === true && (
                    <Field label="DTC Codes (optional)">
                      <input className="fi" placeholder="e.g. P0300, P0171, B1234"
                        value={form.dtc_codes} onChange={e => set("dtc_codes", e.target.value)} />
                    </Field>
                  )}
                </SectionCard>
                <BtnRow onBack={() => setStep(3)} onNext={() => setStep(5)} />
              </motion.div>
            )}

            {/* ── Step 5: Reported Symptoms ── */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
                <SectionCard title="Reported Symptoms" icon="⚠️">
                  <p className="text-sm mb-3" style={{ color: MUTED }}>Select any symptoms your vehicle is currently experiencing:</p>
                  {[
                    { key: "has_unusual_noise",   label: "🔊 Unusual Noise",    desc: "Abnormal sounds from engine or body" },
                    { key: "has_vibration",        label: "📳 Vibration",         desc: "Unusual vibrations in steering or cabin" },
                    { key: "has_reduced_mileage", label: "⛽ Reduced Mileage",  desc: "Fuel consumption has increased noticeably" },
                    { key: "has_braking_issues",  label: "🛑 Braking Issues",    desc: "Brakes feel delayed or unresponsive" },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: form[key] ? "#EF444418" : SURFACE,
                        border:     `1px solid ${form[key] ? "#EF4444" : BORDER}`,
                      }}
                      onClick={() => set(key, !form[key])}
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: form[key] ? "#EF4444" : "transparent", border: `2px solid ${form[key] ? "#EF4444" : MUTED}` }}>
                        {form[key] && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: TEXT }}>{label}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                  <Field label="Other Issues (optional)">
                    <textarea className="fi" rows={2} placeholder="Describe any other problems..." value={form.additional_symptoms} onChange={e => set("additional_symptoms", e.target.value)} />
                  </Field>
                </SectionCard>

                <div className="flex gap-3">
                  <button type="button" className="flex-1 py-3 rounded-xl text-sm font-semibold"
                    style={{ background: SURFACE, color: MUTED, border: `1px solid ${BORDER}` }}
                    onClick={() => setStep(4)}>
                    ← Back
                  </button>
                </div>
                <button type="button" className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}
                  disabled={loading} onClick={handleQuick}>
                  {loading ? "Checking..." : "⚡ Quick Check (without saving)"}
                </button>
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: PRIMARY, color: BG, opacity: loading ? 0.6 : 1 }}
                  disabled={loading}>
                  {loading ? "🔄 Running check..." : "Save vehicle & run check"}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </form>
      </div>

      <style>{`
        .fi { width:100%; background:${SURFACE}; border:1px solid ${BORDER}; border-radius:10px; padding:10px 12px; color:${TEXT}; font-size:0.875rem; outline:none; font-family:inherit; transition:border-color 0.2s; }
        .fi:focus { border-color:${PRIMARY}; }
        select.fi option { background:${CARD}; }
      `}</style>
    </div>
  );
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: PRIMARY }}>{icon} {title}</p>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.75rem", color: MUTED, marginBottom: 4, fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}
function Row({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>{children}</div>;
}
function BtnRow({ onBack, onNext }) {
  return (
    <div className="flex gap-3">
      {onBack && (
        <button type="button" onClick={onBack} className="flex-1 py-3 rounded-xl text-sm font-semibold"
          style={{ background: SURFACE, color: MUTED, border: `1px solid ${BORDER}` }}>
          ← Back
        </button>
      )}
      {onNext && (
        <button type="button" onClick={onNext} className="flex-1 py-3 rounded-xl text-sm font-bold"
          style={{ background: PRIMARY, color: BG }}>
          Continue →
        </button>
      )}
    </div>
  );
}
