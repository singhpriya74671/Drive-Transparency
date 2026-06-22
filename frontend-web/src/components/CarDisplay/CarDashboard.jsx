import React from "react";
import { motion } from "framer-motion";

/**
 * Car Infotainment Display Mode
 * Optimised for 800×480 / 1024×600 car screens.
 * Theme: Dark grey (#1C1C1C / #272727) + warm beige (#DDD0C8).
 */

const URGENCY_COLOR = {
  critical: "#CF5C5C",
  warning:  "#D4935E",
  good:     "#4CAF7D",
};

const STATUS_TEXT = {
  critical: "IMMEDIATE ATTENTION REQUIRED",
  warning:  "SERVICE RECOMMENDED",
  good:     "VEHICLE IN GOOD CONDITION",
};

export default function CarDashboard({ report }) {
  if (!report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#1C1C1C" }}>
        <span className="text-6xl">🚗</span>
        <p className="text-2xl font-bold" style={{ color: "#8C8480" }}>No Vehicle Data Available</p>
        <p className="text-sm" style={{ color: "#555" }}>Run an analysis from the web app or mobile app first.</p>
      </div>
    );
  }

  const { overall_health_score, overall_status, top_alert, components } = report;
  const alertColor    = URGENCY_COLOR[overall_status] || "#4CAF7D";
  const criticalItems = components.filter(c => c.urgency === "critical");
  const warningItems  = components.filter(c => c.urgency === "warning");

  return (
    <div className="car-screen w-full min-h-screen flex flex-col" style={{ background: "#1C1C1C", color: "#F0EBE5" }}>

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4" style={{ background: "#272727", borderBottom: "1px solid #3D3D3D" }}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚗</span>
          <span className="text-lg font-bold" style={{ color: "#F0EBE5" }}>Drive Transparency</span>
          <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: "#DDD0C822", color: "#DDD0C8" }}>LIVE</span>
        </div>
        <p className="text-sm" style={{ color: "#8C8480" }}>
          {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-1">

        {/* Left panel — Score */}
        <div className="flex flex-col items-center justify-center px-10 py-6 gap-5"
          style={{ minWidth: 280, borderRight: "1px solid #3D3D3D" }}>

          {/* Ring gauge */}
          <div className="relative" style={{ width: 170, height: 170 }}>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#323232" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9"
                fill="none"
                stroke={alertColor}
                strokeWidth="3"
                strokeDasharray={`${overall_health_score} ${100 - overall_health_score}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1.5s ease", filter: `drop-shadow(0 0 6px ${alertColor}88)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black" style={{ color: "#F0EBE5" }}>{Math.round(overall_health_score)}</span>
              <span className="text-xs font-medium" style={{ color: "#8C8480" }}>/ 100</span>
            </div>
          </div>

          <motion.p
            animate={{ opacity: overall_status === "critical" ? [1, 0.4, 1] : 1 }}
            transition={{ repeat: overall_status === "critical" ? Infinity : 0, duration: 1.2 }}
            className="text-center font-bold tracking-wide text-sm"
            style={{ color: alertColor }}
          >
            {STATUS_TEXT[overall_status]}
          </motion.p>

          {top_alert && (
            <div className="text-center text-xs px-4 py-2 rounded-lg w-full"
              style={{ background: `${alertColor}15`, color: alertColor, border: `1px solid ${alertColor}33` }}>
              {top_alert}
            </div>
          )}

          <div className="flex gap-5 w-full justify-center">
            {[
              { label: "Critical", color: "#CF5C5C", count: criticalItems.length },
              { label: "Warning",  color: "#D4935E", count: warningItems.length },
              { label: "Healthy",  color: "#4CAF7D", count: components.filter(c => c.urgency === "good").length },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black" style={{ color: s.color }}>{s.count}</p>
                <p className="text-xs" style={{ color: "#8C8480" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — Components */}
        <div className="flex-1 px-6 py-5 overflow-y-auto">
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#8C8480" }}>Component Health</p>
          <div className="grid grid-cols-2 gap-3">
            {components.slice(0, 6).map(comp => {
              const color = URGENCY_COLOR[comp.urgency] || "#4CAF7D";
              return (
                <div key={comp.component} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "#272727", border: `1px solid ${color}33` }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#F0EBE5" }}>{comp.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "#323232" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${comp.health_score}%`, background: color, boxShadow: `0 0 4px ${color}88` }} />
                      </div>
                      <span className="text-xs font-mono" style={{ color }}>{Math.round(comp.health_score)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(criticalItems.length > 0 || warningItems.length > 0) && (
            <div className="mt-4 p-3 rounded-xl" style={{ background: "#272727", border: "1px solid #3D3D3D" }}>
              {criticalItems.length > 0 && (
                <p className="text-sm" style={{ color: "#CF5C5C" }}>
                  ⚠️ <strong>Immediate:</strong> {criticalItems.map(c => c.label).join(", ")}
                </p>
              )}
              {warningItems.length > 0 && (
                <p className="text-sm mt-1" style={{ color: "#D4935E" }}>
                  🔔 <strong>Warning:</strong> {warningItems.map(c => c.label).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-8 py-3 text-xs"
        style={{ background: "#272727", borderTop: "1px solid #3D3D3D", color: "#555" }}>
        <span>Drive Transparency v1.0</span>
        <span>Last updated: {new Date().toLocaleDateString("en-IN")}</span>
        <span className="px-3 py-1 rounded-full font-semibold"
          style={{ background: `${alertColor}15`, color: alertColor, border: `1px solid ${alertColor}33` }}>
          {overall_status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
