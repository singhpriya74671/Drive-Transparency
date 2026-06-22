import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const BG      = "#1C1C1C";
const CARD    = "#272727";
const SURFACE = "#323232";
const PRIMARY = "#DDD0C8";
const TEXT    = "#F0EBE5";
const MUTED   = "#8C8480";
const BORDER  = "#3D3D3D";

const STEPS = [
  { n: 1, label: "Vehicle Info",      icon: "🚗" },
  { n: 2, label: "Service History",   icon: "🔧" },
  { n: 3, label: "Condition",         icon: "📊" },
  { n: 4, label: "OBD-II / AI",       icon: "🤖" },
  { n: 5, label: "Symptoms",          icon: "⚠️" },
];

const INITIAL = {
  owner_name: "", phone: "", vehicle_model: "", manufacturer: "",
  manufacturing_year: 2020, fuel_type: "petrol",
  last_service_date: "", last_oil_change_date: "",
  mileage_km: "", battery_age_months: 0, brake_condition: "good", fuel_efficiency_kmpl: "",
  has_unusual_noise: false, has_vibration: false,
  has_reduced_mileage: false, has_braking_issues: false,
  additional_symptoms: "",
  // OBD-II / Telematics
  battery_voltage: 12.6,
  engine_temp_c: 90,
  has_dtc: false,
  dtc_codes: "",
  avg_speed_kmh: 45,
  engine_runtime_hours: "",
};

export default function VehicleInput() {
  const [form, setForm] = useState(INITIAL);
  const [step, setStep] = useState(1);
  const { createVehicle, analyzeVehicle, analyzeQuick, loading } = useVehicle();
  const { user } = useAuth();
  const navigate = useNavigate();

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const buildPayload = () => ({
    ...form,
    manufacturing_year:     Number(form.manufacturing_year),
    mileage_km:             Number(form.mileage_km),
    battery_age_months:     Number(form.battery_age_months),
    fuel_efficiency_kmpl:   form.fuel_efficiency_kmpl ? Number(form.fuel_efficiency_kmpl) : null,
    last_service_date:      form.last_service_date    || null,
    last_oil_change_date:   form.last_oil_change_date || null,
    battery_voltage:        Number(form.battery_voltage),
    engine_temp_c:          Number(form.engine_temp_c),
    avg_speed_kmh:          Number(form.avg_speed_kmh),
    engine_runtime_hours:   form.engine_runtime_hours ? Number(form.engine_runtime_hours) : null,
    dtc_codes:              form.dtc_codes || null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const vehicle = await createVehicle(buildPayload());
      const result  = await analyzeVehicle(vehicle.id);
      if (result) navigate("/dashboard");
    } catch {
      // individual toasts already shown by createVehicle / analyzeVehicle
    }
  };

  const handleQuick = async () => {
    const result = await analyzeQuick(buildPayload());
    if (result) navigate("/dashboard");
  };

  const voltageColor = form.battery_voltage < 11.8 ? "#CF5C5C" : form.battery_voltage < 12.2 ? "#D4935E" : "#4CAF7D";
  const tempColor    = form.engine_temp_c > 115 ? "#CF5C5C" : form.engine_temp_c > 100 ? "#D4935E" : "#4CAF7D";

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: BG, color: TEXT }}>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-1" style={{ color: TEXT }}>Vehicle Analysis</h1>
          <p className="text-sm" style={{ color: MUTED }}>
            {user ? `Welcome, ${user.name} — ` : ""}
            Fill in the details to generate your AI health report.
          </p>

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
                      <input className="fi" placeholder="e.g. Swift Dzire, i20" value={form.vehicle_model} onChange={e => set("vehicle_model", e.target.value)} required />
                    </Field>
                    <Field label="Manufacturer">
                      <input className="fi" placeholder="e.g. Maruti, Hyundai" value={form.manufacturer} onChange={e => set("manufacturer", e.target.value)} />
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
                    💡 Leave blank if unsure — the AI will factor this as a risk element.
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
                <SectionCard title="OBD-II & AI Diagnostics" icon="🤖">
                  <div className="p-3 rounded-xl text-xs mb-2" style={{ background: `${PRIMARY}15`, border: `1px solid ${PRIMARY}33`, color: MUTED }}>
                    🔌 These readings come from your OBD-II port / dashboard. Approximate values are fine — the AI uses them to refine predictions.
                  </div>

                  {/* Battery Voltage */}
                  <Field label={`Battery Voltage: ${form.battery_voltage}V`}>
                    <div className="space-y-2">
                      <input type="range" min="10.5" max="14.8" step="0.1"
                        value={form.battery_voltage}
                        onChange={e => set("battery_voltage", parseFloat(e.target.value))}
                        style={{ width: "100%", accentColor: voltageColor }}
                      />
                      <div className="flex justify-between text-xs" style={{ color: MUTED }}>
                        <span style={{ color: "#CF5C5C" }}>10.5V (Critical)</span>
                        <span style={{ color: voltageColor, fontWeight: 600 }}>{form.battery_voltage}V</span>
                        <span style={{ color: "#4CAF7D" }}>14.8V (Good)</span>
                      </div>
                      <p className="text-xs" style={{ color: voltageColor }}>
                        {form.battery_voltage < 11.8 ? "⚠️ Very low — battery may fail soon" :
                         form.battery_voltage < 12.2 ? "🟡 Below normal — monitor closely" :
                         form.battery_voltage < 12.6 ? "🟢 Acceptable range" : "✅ Good charge level"}
                      </p>
                    </div>
                  </Field>

                  {/* Engine Temperature */}
                  <Field label={`Engine Temperature: ${form.engine_temp_c}°C`}>
                    <div className="space-y-2">
                      <input type="range" min="60" max="135" step="1"
                        value={form.engine_temp_c}
                        onChange={e => set("engine_temp_c", parseInt(e.target.value))}
                        style={{ width: "100%", accentColor: tempColor }}
                      />
                      <div className="flex justify-between text-xs" style={{ color: MUTED }}>
                        <span>60°C (Cold)</span>
                        <span style={{ color: tempColor, fontWeight: 600 }}>{form.engine_temp_c}°C</span>
                        <span style={{ color: "#CF5C5C" }}>135°C (Overheating)</span>
                      </div>
                      <p className="text-xs" style={{ color: tempColor }}>
                        {form.engine_temp_c > 115 ? "🔴 Overheating — inspect cooling system immediately" :
                         form.engine_temp_c > 100 ? "🟡 Elevated — monitor temperature" :
                         "✅ Normal operating temperature"}
                      </p>
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
                  <div
                    className="flex items-center gap-4 p-3.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: form.has_dtc ? "#CF5C5C18" : SURFACE,
                      border:     `1px solid ${form.has_dtc ? "#CF5C5C" : BORDER}`,
                    }}
                    onClick={() => set("has_dtc", !form.has_dtc)}
                  >
                    <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{ background: form.has_dtc ? "#CF5C5C" : "transparent", border: `2px solid ${form.has_dtc ? "#CF5C5C" : MUTED}` }}>
                      {form.has_dtc && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                    </div>
                    <div>
                      <p className="font-medium text-sm" style={{ color: TEXT }}>⚡ Fault Codes Active (DTC)</p>
                      <p className="text-xs" style={{ color: MUTED }}>Check Engine light is on or OBD scanner shows error codes</p>
                    </div>
                  </div>

                  {form.has_dtc && (
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
                        background: form[key] ? "#CF5C5C18" : SURFACE,
                        border:     `1px solid ${form[key] ? "#CF5C5C" : BORDER}`,
                      }}
                      onClick={() => set(key, !form[key])}
                    >
                      <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: form[key] ? "#CF5C5C" : "transparent", border: `2px solid ${form[key] ? "#CF5C5C" : MUTED}` }}>
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
                  {loading ? "Analyzing..." : "⚡ Quick AI Analysis (without saving)"}
                </button>
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-bold"
                  style={{ background: PRIMARY, color: BG, opacity: loading ? 0.6 : 1 }}
                  disabled={loading}>
                  {loading ? "🔄 Running AI Analysis..." : "🤖 Save & Run Full AI Analysis"}
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
