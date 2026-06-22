import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";
import HealthGauge from "../components/Dashboard/HealthGauge";
import ComponentCard from "../components/Dashboard/ComponentCard";
import NearbyServiceCenters from "../components/NearbyServiceCenters";
import VehicleIntelligence from "../components/VehicleIntelligence";

const BG      = "#1C1C1C";
const CARD    = "#272727";
const SURFACE = "#323232";
const PRIMARY = "#DDD0C8";
const TEXT    = "#F0EBE5";
const MUTED   = "#8C8480";
const BORDER  = "#3D3D3D";
const SUCCESS = "#4CAF7D";
const WARNING = "#D4935E";
const DANGER  = "#CF5C5C";

export default function Dashboard() {
  const { report, selectedVehicle } = useVehicle();
  const navigate = useNavigate();

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: BG, color: TEXT }}>
        <span className="text-6xl">🚗</span>
        <p className="text-xl text-center px-6" style={{ color: MUTED }}>No report found. Please enter your vehicle details first.</p>
        <button className="px-6 py-3 rounded-xl font-semibold" style={{ background: PRIMARY, color: BG }}
          onClick={() => navigate("/input")}>
          Add Vehicle
        </button>
      </div>
    );
  }

  const totalCostMin = report.components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_min : 0), 0);
  const totalCostMax = report.components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_max : 0), 0);

  const dtcCodes = selectedVehicle?.dtc_codes
    ? selectedVehicle.dtc_codes.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const timelineItems = report.components
    .filter(c => c.maintenance_probability != null)
    .sort((a, b) => (a.predicted_service_window_days ?? 999) - (b.predicted_service_window_days ?? 999));

  const bv = selectedVehicle?.battery_voltage ?? 12.6;
  const et = selectedVehicle?.engine_temp_c   ?? 90;
  const bvColor = bv >= 12.4 ? SUCCESS : bv >= 11.8 ? WARNING : DANGER;
  const etColor = et <= 95   ? SUCCESS : et <= 110   ? WARNING : DANGER;
  const bvLabel = bv >= 12.4 ? "Good"  : bv >= 11.8 ? "Low"    : "Critical";
  const etLabel = et <= 95   ? "Normal": et <= 110   ? "Warm"   : "Overheat";

  const statusColor = report.overall_status === "good" ? SUCCESS : report.overall_status === "critical" ? DANGER : WARNING;

  return (
    <div className="min-h-screen pb-10" style={{ background: BG, color: TEXT }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: CARD, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <h1 className="font-bold" style={{ color: TEXT }}>Vehicle Health Dashboard</h1>
            {selectedVehicle && (
              <p className="text-sm" style={{ color: MUTED }}>
                {selectedVehicle.vehicle_model} · {selectedVehicle.manufacturing_year}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="text-xs px-3 py-2 rounded-lg"
            style={{ background: SURFACE, color: PRIMARY, border: `1px solid ${BORDER}` }}
            onClick={() => navigate("/car-mode")}>
            🚘 Car Mode
          </button>
          <button className="text-xs px-3 py-2 rounded-lg font-semibold"
            style={{ background: PRIMARY, color: BG }}
            onClick={() => navigate("/input")}>
            + New Vehicle
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

        {/* ── Vehicle Profile Card ─────────────────────────────────────── */}
        {selectedVehicle && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${PRIMARY}18`, border: `1px solid ${PRIMARY}30` }}>🚗</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-base" style={{ color: TEXT }}>{selectedVehicle.vehicle_model}</h2>
                  {selectedVehicle.manufacturer && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${PRIMARY}18`, color: PRIMARY }}>{selectedVehicle.manufacturer}</span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${statusColor}20`, color: statusColor }}>
                    ● {report.overall_status.charAt(0).toUpperCase() + report.overall_status.slice(1)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {[
                    { icon: "📅", v: selectedVehicle.manufacturing_year + " Model" },
                    { icon: "🛣️", v: selectedVehicle.mileage_km.toLocaleString("en-IN") + " km" },
                    { icon: "⛽", v: selectedVehicle.fuel_type?.charAt(0).toUpperCase() + selectedVehicle.fuel_type?.slice(1) || "Petrol" },
                    selectedVehicle.last_service_date && {
                      icon: "🔧",
                      v: "Service: " + new Date(selectedVehicle.last_service_date).toLocaleDateString("en-IN"),
                    },
                  ].filter(Boolean).map(({ icon, v }) => (
                    <span key={v} className="text-xs flex items-center gap-1" style={{ color: MUTED }}>
                      {icon} {v}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-4xl font-black leading-none"
                  style={{ color: report.overall_health_score >= 70 ? SUCCESS : report.overall_health_score >= 40 ? WARNING : DANGER }}>
                  {Math.round(report.overall_health_score)}
                </p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>/ 100 Health</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── OBD Live Status + Fault Codes ───────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* OBD Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>OBD Status</p>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5"
                style={{ background: `${SUCCESS}18`, color: SUCCESS }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: SUCCESS }}></span>Connected
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: "Battery Voltage", value: `${bv.toFixed(1)} V`, color: bvColor, status: bvLabel, pct: ((bv - 10) / 5) * 100 },
                { label: "Engine Temp",     value: `${et.toFixed(0)} °C`,  color: etColor, status: etLabel, pct: (et / 150) * 100 },
                { label: "Avg Speed",       value: `${(selectedVehicle?.avg_speed_kmh ?? 45).toFixed(0)} km/h`, color: PRIMARY, status: "Logged", pct: ((selectedVehicle?.avg_speed_kmh ?? 45) / 200) * 100 },
              ].map(({ label, value, color, status, pct }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: MUTED }}>{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color }}>{status}</span>
                      <span className="text-sm font-bold" style={{ color: TEXT }}>{value}</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: SURFACE }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                      style={{ background: color }} />
                  </div>
                </div>
              ))}
              {selectedVehicle?.engine_runtime_hours != null && (
                <div className="flex justify-between items-center pt-2" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <span className="text-xs" style={{ color: MUTED }}>Engine Runtime</span>
                  <span className="text-sm font-semibold" style={{ color: TEXT }}>{selectedVehicle.engine_runtime_hours.toFixed(0)} hrs</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Fault Codes */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>Fault Codes (DTC)</p>
              {selectedVehicle?.has_dtc && dtcCodes.length > 0 ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `${DANGER}18`, color: DANGER }}>{dtcCodes.length} Active</span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: `${SUCCESS}18`, color: SUCCESS }}>Clear</span>
              )}
            </div>
            {selectedVehicle?.has_dtc && dtcCodes.length > 0 ? (
              <div className="space-y-2">
                {dtcCodes.slice(0, 4).map((code, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: `${DANGER}10`, border: `1px solid ${DANGER}30` }}>
                    <div>
                      <p className="font-mono text-sm font-bold" style={{ color: DANGER }}>{code}</p>
                      <p className="text-xs" style={{ color: MUTED }}>Diagnostic Trouble Code</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: `${DANGER}25`, color: DANGER }}>High</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <span className="text-3xl">✅</span>
                <p className="text-sm" style={{ color: MUTED }}>No fault codes detected</p>
                <p className="text-xs" style={{ color: "#555" }}>All systems normal</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Overall Health ───────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <h2 className="text-xs uppercase tracking-widest mb-6" style={{ color: MUTED }}>Overall Vehicle Health</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthGauge score={report.overall_health_score} status={report.overall_status} />
            <div className="flex-1 space-y-4 w-full">
              {report.top_alert && (
                <div className="rounded-xl p-4" style={{ background: "#CF5C5C18", border: "1px solid #CF5C5C44" }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: DANGER }}>⚠️ Alert</p>
                  <p style={{ color: TEXT }}>{report.top_alert}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: "Critical", color: DANGER,   count: report.components.filter(c => c.urgency === "critical").length },
                  { label: "Warnings", color: WARNING,  count: report.components.filter(c => c.urgency === "warning").length },
                  { label: "Healthy",  color: SUCCESS,  count: report.components.filter(c => c.urgency === "good").length },
                ].map(({ label, color, count }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: BG }}>
                    <p className="text-2xl font-bold" style={{ color }}>{count}</p>
                    <p className="text-xs mt-1" style={{ color: MUTED }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Vehicle Intelligence (Unified AI Panel) ─────────────────── */}
        <VehicleIntelligence report={report} selectedVehicle={selectedVehicle} />

        {/* ── Maintenance Timeline ─────────────────────────────────────── */}
        {timelineItems.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h2 className="text-xs uppercase tracking-widest mb-5" style={{ color: MUTED }}>Maintenance Timeline</h2>
            <div className="relative pl-10">
              <div className="absolute left-4 top-2 bottom-2 w-px" style={{ background: BORDER }} />

              {/* Today */}
              <div className="relative mb-4">
                <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2"
                  style={{ background: PRIMARY, borderColor: PRIMARY }} />
                <p className="text-xs font-bold" style={{ color: PRIMARY }}>
                  Today · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              {timelineItems.map((c) => {
                const days  = c.predicted_service_window_days ?? 180;
                const prob  = c.maintenance_probability ?? 0;
                const color = prob >= 70 ? DANGER : prob >= 40 ? WARNING : SUCCESS;
                const due   = new Date(Date.now() + days * 86400000);
                const span  = days <= 7 ? "This Week" : days <= 30 ? `${days} Days` : `${Math.round(days / 30)} Months`;
                return (
                  <div key={c.component} className="relative mb-3">
                    <div className="absolute -left-6 top-3 w-3 h-3 rounded-full"
                      style={{ background: color, boxShadow: `0 0 6px ${color}80` }} />
                    <div className="p-3 rounded-xl" style={{ background: `${color}10`, border: `1px solid ${color}28` }}>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm" style={{ color: TEXT }}>{c.label || c.component}</p>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                          style={{ background: `${color}25`, color }}>{span}</span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <p className="text-xs" style={{ color: MUTED }}>
                          {due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-xs" style={{ color: MUTED }}>{prob.toFixed(0)}% risk</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Cost Forecasting ─────────────────────────────────────────── */}
        {totalCostMin > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>Estimated Upcoming Costs</h2>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: SURFACE, color: MUTED }}>Next 6 Months</span>
            </div>
            <div className="space-y-2 mb-4">
              {report.components
                .filter(c => c.urgency !== "good")
                .sort((a, b) => (a.urgency === "critical" ? -1 : 1))
                .map(c => {
                  const color = c.urgency === "critical" ? DANGER : WARNING;
                  return (
                    <div key={c.component} className="flex items-center justify-between p-3 rounded-xl" style={{ background: SURFACE }}>
                      <div className="flex items-center gap-2">
                        <span style={{ color, fontSize: 10 }}>●</span>
                        <span className="text-sm" style={{ color: TEXT }}>{c.label || c.component}</span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: TEXT }}>
                        ₹{c.estimated_cost_min.toLocaleString("en-IN")} – ₹{c.estimated_cost_max.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: `${PRIMARY}12`, border: `1px solid ${PRIMARY}30` }}>
              <div>
                <p className="text-xs" style={{ color: MUTED }}>Total Estimate</p>
                <p className="text-xs" style={{ color: "#555" }}>Next 6 Months</p>
              </div>
              <p className="text-xl font-black" style={{ color: PRIMARY }}>
                ₹{totalCostMin.toLocaleString("en-IN")} – ₹{totalCostMax.toLocaleString("en-IN")}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Recommendations ──────────────────────────────────────────── */}
        {report.components.some(c => c.urgency !== "good") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Recommendations</h2>
            <div className="space-y-2">
              {report.components
                .filter(c => c.urgency !== "good")
                .sort((a, b) => (a.urgency === "critical" ? -1 : 1))
                .map(c => {
                  const color = c.urgency === "critical" ? DANGER : WARNING;
                  return (
                    <div key={c.component} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
                      <span style={{ color, fontSize: 16 }}>{c.urgency === "critical" ? "🔴" : "🟡"}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color }}>{c.label || c.component}</p>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{c.explanation}</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: PRIMARY }}>
                          Estimated: ₹{c.estimated_cost_min.toLocaleString("en-IN")} – ₹{c.estimated_cost_max.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* ── Component Analysis ───────────────────────────────────────── */}
        <div>
          <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Component Analysis</h2>
          <div className="space-y-3">
            {report.components.map((comp, i) => (
              <motion.div key={comp.component}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <ComponentCard component={comp} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Nearby Service Centers ───────────────────────────────────── */}
        {report.components.some(c => c.urgency !== "good") && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <NearbyServiceCenters />
          </motion.div>
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs" style={{ color: "#4B5563" }}>
            Generated: {new Date(report.generated_at).toLocaleString("en-IN")}
          </p>
          <button onClick={() => navigate("/history")} className="text-xs underline" style={{ color: PRIMARY }}>
            View Service History →
          </button>
        </div>
      </div>
    </div>
  );
}
