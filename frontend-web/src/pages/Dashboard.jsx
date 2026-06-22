import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";
import HealthGauge from "../components/Dashboard/HealthGauge";
import ComponentCard from "../components/Dashboard/ComponentCard";

const BG      = "#1C1C1C";
const CARD    = "#272727";
const SURFACE = "#323232";
const PRIMARY = "#DDD0C8";
const TEXT    = "#F0EBE5";
const MUTED   = "#8C8480";
const BORDER  = "#3D3D3D";

export default function Dashboard() {
  const { report, selectedVehicle } = useVehicle();
  const navigate = useNavigate();

  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: BG, color: TEXT }}>
        <span className="text-6xl">🚗</span>
        <p className="text-xl" style={{ color: MUTED }}>No report found. Please enter your vehicle details first.</p>
        <button
          className="px-6 py-3 rounded-xl font-semibold"
          style={{ background: PRIMARY, color: BG }}
          onClick={() => navigate("/input")}
        >
          Add Vehicle
        </button>
      </div>
    );
  }

  const totalCostMin = report.components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_min : 0), 0);
  const totalCostMax = report.components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_max : 0), 0);

  return (
    <div className="min-h-screen pb-10" style={{ background: BG, color: TEXT }}>

      {/* Header */}
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
          <button
            className="text-xs px-3 py-2 rounded-lg"
            style={{ background: SURFACE, color: PRIMARY, border: `1px solid ${BORDER}` }}
            onClick={() => navigate("/car-mode")}
          >
            🚘 Car Display Mode
          </button>
          <button
            className="text-xs px-3 py-2 rounded-lg font-semibold"
            style={{ background: PRIMARY, color: BG }}
            onClick={() => navigate("/input")}
          >
            + New Vehicle
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Overall Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}
        >
          <h2 className="text-xs uppercase tracking-widest mb-6" style={{ color: MUTED }}>Overall Vehicle Health</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <HealthGauge score={report.overall_health_score} status={report.overall_status} />
            <div className="flex-1 space-y-4">
              {report.top_alert && (
                <div className="rounded-xl p-4" style={{ background: "#CF5C5C18", border: "1px solid #CF5C5C44" }}>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#CF5C5C" }}>⚠️ Alert</p>
                  <p style={{ color: TEXT }}>{report.top_alert}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Critical", color: "#CF5C5C", count: report.components.filter(c => c.urgency === "critical").length },
                  { label: "Warnings", color: "#D4935E", count: report.components.filter(c => c.urgency === "warning").length },
                  { label: "Healthy",  color: "#4CAF7D", count: report.components.filter(c => c.urgency === "good").length },
                ].map(({ label, color, count }) => (
                  <div key={label} className="rounded-xl p-3" style={{ background: BG }}>
                    <p className="text-2xl font-bold" style={{ color }}>{count}</p>
                    <p className="text-xs mt-1" style={{ color: MUTED }}>{label}</p>
                  </div>
                ))}
              </div>
              {totalCostMin > 0 && (
                <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: BG }}>
                  <span className="text-sm" style={{ color: MUTED }}>Estimated Service Cost</span>
                  <span className="font-bold" style={{ color: TEXT }}>
                    ₹{totalCostMin.toLocaleString()} – ₹{totalCostMax.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Recommendations */}
        {report.components.some(c => c.urgency !== "good") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-5"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Recommendations</h2>
            <div className="space-y-2">
              {report.components
                .filter(c => c.urgency !== "good")
                .sort((a, b) => (a.urgency === "critical" ? -1 : 1))
                .map(c => {
                  const color = c.urgency === "critical" ? "#CF5C5C" : "#D4935E";
                  return (
                    <div key={c.component} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: `${color}10`, border: `1px solid ${color}33` }}>
                      <span style={{ color, fontSize: 16 }}>{c.urgency === "critical" ? "🔴" : "🟡"}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color }}>{c.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>{c.explanation}</p>
                        <p className="text-xs mt-1 font-medium" style={{ color: PRIMARY }}>
                          Estimated: ₹{c.estimated_cost_min.toLocaleString()} – ₹{c.estimated_cost_max.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </motion.div>
        )}

        {/* Component Cards */}
        <div>
          <h2 className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Component Analysis</h2>
          <div className="space-y-3">
            {report.components.map((comp, i) => (
              <motion.div
                key={comp.component}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ComponentCard component={comp} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4">
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
