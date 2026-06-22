import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CARD    = "#272727";
const SURFACE = "#323232";
const TEXT    = "#F0EBE5";
const MUTED   = "#8C8480";
const BORDER  = "#3D3D3D";
const PRIMARY = "#DDD0C8";

const URGENCY = {
  critical: { bg: "#CF5C5C18", border: "#CF5C5C", text: "#CF5C5C", label: "Critical" },
  warning:  { bg: "#D4935E18", border: "#D4935E", text: "#D4935E", label: "Warning"  },
  good:     { bg: "#4CAF7D10", border: "#4CAF7D", text: "#4CAF7D", label: "Healthy"  },
};

const ICONS = {
  engine_oil:   "🛢️",
  battery:      "🔋",
  brakes:       "🛑",
  tyres:        "⚙️",
  coolant:      "🌡️",
  fuel_system:  "⛽",
  transmission: "⚙️",
  spark_plugs:  "⚡",
};

export default function ComponentCard({ component }) {
  const [open, setOpen] = useState(false);
  const s    = URGENCY[component.urgency] || URGENCY.good;
  const icon = ICONS[component.component] || "🔧";

  return (
    <motion.div
      layout
      className="rounded-xl p-4 cursor-pointer"
      style={{ background: s.bg, border: `1px solid ${s.border}44` }}
      onClick={() => setOpen(!open)}
      whileHover={{ scale: 1.005 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: TEXT }}>{component.label}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: SURFACE }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${component.health_score}%`, background: s.border }}
                />
              </div>
              <span className="text-xs font-mono" style={{ color: s.text }}>
                {Math.round(component.health_score)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: `${s.border}22`, color: s.border, border: `1px solid ${s.border}44` }}
          >
            {s.label}
          </span>
          <span className="text-xs" style={{ color: MUTED }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "#C8BFB8" }}>{component.explanation}</p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs" style={{ color: MUTED }}>Estimated Cost:</span>
              <span className="text-sm font-semibold" style={{ color: PRIMARY }}>
                ₹{component.estimated_cost_min.toLocaleString()} – ₹{component.estimated_cost_max.toLocaleString()}
              </span>
            </div>
            {component.shap_factors?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs mb-2" style={{ color: MUTED }}>Key Factors:</p>
                <div className="flex flex-wrap gap-2">
                  {component.shap_factors.map((f, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: SURFACE, color: "#9CA3AF" }}>
                      {f.factor}: <strong style={{ color: TEXT }}>{String(f.value)}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
