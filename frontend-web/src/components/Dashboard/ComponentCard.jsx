import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { T } from "./dashboardUtils";

const SURFACE = T.surface;
const TEXT    = T.text;
const MUTED   = T.muted;
const BORDER  = T.border;
const PRIMARY = T.blue;

const URGENCY = {
  critical: { bg: "#FEF2F2", border: T.danger,  text: T.danger,  label: "Critical" },
  warning:  { bg: "#FFFBEB", border: T.warning, text: "#B45309", label: "Warning"  },
  good:     { bg: "#F0FDF4", border: T.success, text: "#047857", label: "Healthy"  },
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
      style={{ background: s.bg, border: `1px solid ${s.border}33` }}
      onClick={() => setOpen(!open)}
      whileHover={{ scale: 1.005 }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" style={{ color: TEXT }}>{component.label}</p>
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: "#E2E8F0" }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ width: `${component.health_score}%`, background: s.border }}
                />
              </div>
              <span className="font-mono text-xs" style={{ color: s.text }}>
                {Math.round(component.health_score)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: `${s.border}18`, color: s.text, border: `1px solid ${s.border}33` }}
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
            <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{component.explanation}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="text-xs" style={{ color: MUTED }}>Estimated cost:</span>
              <span className="text-sm font-semibold" style={{ color: PRIMARY }}>
                ₹{component.estimated_cost_min.toLocaleString()} – ₹{component.estimated_cost_max.toLocaleString()}
              </span>
            </div>
            {component.shap_factors?.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-xs" style={{ color: MUTED }}>Key factors:</p>
                <div className="flex flex-wrap gap-2">
                  {component.shap_factors.map((f, i) => (
                    <span key={i} className="rounded-full px-2 py-1 text-xs" style={{ background: SURFACE, color: MUTED }}>
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
