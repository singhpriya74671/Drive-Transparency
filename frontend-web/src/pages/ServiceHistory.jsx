import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const BG      = "#1C1C1C";
const CARD    = "#272727";
const SURFACE = "#323232";
const PRIMARY = "#DDD0C8";
const TEXT    = "#F0EBE5";
const MUTED   = "#8C8480";
const BORDER  = "#3D3D3D";

const SERVICE_TYPES = [
  { key: "oil_change",        icon: "🛢️", label: "Oil Change" },
  { key: "full_service",      icon: "🔧", label: "Full Service" },
  { key: "tyre_rotation",     icon: "⚙️", label: "Tyre Rotation" },
  { key: "brake_service",     icon: "🛑", label: "Brake Service" },
  { key: "battery_check",     icon: "🔋", label: "Battery Check" },
  { key: "ac_service",        icon: "❄️", label: "AC Service" },
  { key: "spark_plug_change", icon: "⚡", label: "Spark Plug Change" },
  { key: "coolant_flush",     icon: "🌡️", label: "Coolant Flush" },
  { key: "other",             icon: "📋", label: "Other" },
];

const urgencyColor = { critical: "#CF5C5C", warning: "#D4935E", good: "#4CAF7D" };

export default function ServiceHistory() {
  const { selectedVehicle, report } = useVehicle();
  const navigate = useNavigate();
  const [records, setRecords]   = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({
    service_type: "oil_change", service_center: "", actual_cost: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const vehicleId = selectedVehicle?.id;

  useEffect(() => {
    if (!vehicleId) return;
    fetch(`${BASE_URL}/api/maintenance/history/${vehicleId}`)
      .then(r => r.json())
      .then(data => setRecords(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [vehicleId]);

  const setField = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      vehicle_id:    vehicleId,
      service_type:  form.service_type,
      service_center: form.service_center || null,
      actual_cost:   form.actual_cost ? Number(form.actual_cost) : null,
      notes:         form.notes || null,
      is_completed:  true,
    };
    try {
      const res = await fetch(`${BASE_URL}/api/maintenance/history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setRecords(p => [saved, ...p]);
        setForm({ service_type: "oil_change", service_center: "", actual_cost: "", notes: "" });
        setShowForm(false);
      }
    } catch {}
    setSaving(false);
  };

  const totalSpent = records.reduce((s, r) => s + (r.actual_cost || 0), 0);

  return (
    <div className="min-h-screen pb-12" style={{ background: BG, color: TEXT }}>

      {/* Header */}
      <div className="px-6 py-5 flex items-center justify-between" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-sm px-3 py-1.5 rounded-lg"
            style={{ background: SURFACE, color: MUTED, border: `1px solid ${BORDER}` }}
          >
            ← Back
          </button>
          <div>
            <h1 className="font-bold" style={{ color: TEXT }}>Service History</h1>
            {selectedVehicle && (
              <p className="text-xs" style={{ color: MUTED }}>
                {selectedVehicle.vehicle_model} · {selectedVehicle.manufacturing_year}
              </p>
            )}
          </div>
        </div>
        {vehicleId && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm px-4 py-2 rounded-xl font-semibold"
            style={{ background: PRIMARY, color: BG }}
          >
            + Add Record
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Summary cards */}
        {records.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total Services", value: records.length, unit: "" },
              { label: "Total Spent",    value: `₹${totalSpent.toLocaleString()}`, unit: "" },
              { label: "Last Service",   value: records[0] ? SERVICE_TYPES.find(s=>s.key===records[0].service_type)?.label || records[0].service_type : "—", unit: "" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-4 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
                <p className="font-bold text-lg" style={{ color: PRIMARY }}>{value}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Current Health */}
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>Current Vehicle Health</p>
              <button onClick={() => navigate("/dashboard")} className="text-xs underline" style={{ color: PRIMARY }}>
                View Report →
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-black" style={{ color: PRIMARY }}>{Math.round(report.overall_health_score)}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>/ 100</p>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-2">
                {report.components.slice(0, 4).map(c => (
                  <div key={c.component} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: urgencyColor[c.urgency] || "#4CAF7D" }} />
                    <span className="text-xs truncate" style={{ color: MUTED }}>{c.label}</span>
                    <span className="text-xs ml-auto font-mono" style={{ color: urgencyColor[c.urgency] }}>{Math.round(c.health_score)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Add Record Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-5"
            style={{ background: CARD, border: `1px solid ${PRIMARY}55` }}
          >
            <h2 className="font-semibold mb-4" style={{ color: PRIMARY }}>Add Service Record</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="sh-label">Service Type</label>
                  <select className="sh-input" value={form.service_type} onChange={e => setField("service_type", e.target.value)}>
                    {SERVICE_TYPES.map(s => <option key={s.key} value={s.key}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="sh-label">Cost (₹)</label>
                  <input type="number" className="sh-input" placeholder="e.g. 2500" value={form.actual_cost} onChange={e => setField("actual_cost", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="sh-label">Garage / Service Centre</label>
                <input className="sh-input" placeholder="Name of the garage or service centre" value={form.service_center} onChange={e => setField("service_center", e.target.value)} />
              </div>
              <div>
                <label className="sh-label">Notes</label>
                <textarea className="sh-input" rows={2} placeholder="Parts replaced, observations, etc." value={form.notes} onChange={e => setField("notes", e.target.value)} />
              </div>
              <div className="flex gap-3">
                <button type="button" className="flex-1 py-2.5 rounded-xl text-sm"
                  style={{ background: SURFACE, color: MUTED, border: `1px solid ${BORDER}` }}
                  onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: PRIMARY, color: BG, opacity: saving ? 0.6 : 1 }}>
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Timeline */}
        <div>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Service Timeline</p>
          {records.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ background: CARD, border: `1px dashed ${BORDER}` }}>
              <p className="text-4xl mb-3">🔧</p>
              <p className="font-medium" style={{ color: MUTED }}>No service records yet</p>
              <p className="text-sm mt-1" style={{ color: "#555" }}>Add your first service record to start tracking maintenance history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((rec, i) => {
                const sType = SERVICE_TYPES.find(s => s.key === rec.service_type) || SERVICE_TYPES[8];
                return (
                  <motion.div
                    key={rec.id || i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-start gap-4 p-4 rounded-xl"
                    style={{ background: CARD, border: `1px solid ${BORDER}` }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                      style={{ background: SURFACE }}>
                      {sType.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm" style={{ color: TEXT }}>{sType.label}</p>
                        {rec.is_completed && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#4CAF7D22", color: "#4CAF7D" }}>✓ Done</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs" style={{ color: MUTED }}>
                        {rec.service_center && <span>📍 {rec.service_center}</span>}
                        {rec.actual_cost    && <span className="font-semibold" style={{ color: PRIMARY }}>₹{rec.actual_cost.toLocaleString()}</span>}
                        {rec.created_at     && <span>📅 {new Date(rec.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      </div>
                      {rec.notes && <p className="text-xs mt-1.5" style={{ color: "#666" }}>{rec.notes}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .sh-label { display: block; font-size: 0.75rem; color: ${MUTED}; margin-bottom: 4px; font-weight: 500; }
        .sh-input { width: 100%; background: ${SURFACE}; border: 1px solid ${BORDER}; border-radius: 10px; padding: 9px 12px; color: ${TEXT}; font-size: 0.85rem; outline: none; font-family: inherit; }
        .sh-input:focus { border-color: ${PRIMARY}; }
      `}</style>
    </div>
  );
}
