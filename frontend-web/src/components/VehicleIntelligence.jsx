import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { T } from "./Dashboard/dashboardUtils";

const BG      = T.surface;
const SURFACE = T.surface;
const PRIMARY = T.blue;
const TEXT    = T.text;
const MUTED   = T.muted;
const BORDER  = T.border;
const SUCCESS = T.success;
const WARNING = T.warning;
const DANGER  = T.danger;

// ─── Report-grounded replies ──────────────────────────────────────────────────
function getContextualReply(msg, report, selectedVehicle) {
  const q = msg.toLowerCase();
  const components  = report?.components ?? [];
  const score = report?.overall_health_score == null ? null : Math.round(report.overall_health_score);
  const battery = components.find(c => c.component === "battery");
  const engine = components.find(c => c.component === "engine");
  const brakes = components.find(c => c.component === "brakes");
  const codes = selectedVehicle?.dtc_codes?.trim();

  if (q.includes("next") || q.includes("service") || q.includes("what")) {
    const actions = (report?.recommendations || []).map(item => item.action).filter(Boolean);
    if (actions.length) return actions.join(" ");
    return report?.top_alert || "No assessment is available. Enter observed readings or symptoms and run the backend assessment.";
  }

  if (q.includes("health") || q.includes("score") || q.includes("low") || q.includes("why")) {
    if (score == null) return "There is not enough supported input for a score. The current score covers only components assessed by explicit rules.";
    return `Rule-based score: ${score}/100 across ${report.assessed_components_count ?? components.length} assessed component(s). It is not a whole-vehicle health score or an ML prediction. ${report.top_alert || ""}`;
  }

  if (q.includes("cost") || q.includes("estimate") || q.includes("price") || q.includes("money") || q.includes("₹")) {
    return "The project has no verified service-price data, so it does not estimate repair costs. Request a quote from a service center.";
  }

  if (q.includes("brake")) {
    return brakes
      ? `${brakes.explanation} ${brakes.recommended_action || ""}`.trim()
      : "Brake condition was not assessed. Enter a reported condition or symptom; the app does not infer pad wear.";
  }

  if (q.includes("fault") || q.includes("dtc") || q.includes("code") || q.includes("p0")) {
    if (codes) return `Reported fault code(s): ${codes}. The code's severity and failed component are not inferred. Have a technician read and diagnose them.`;
    if (selectedVehicle?.has_dtc === false) return "No active fault codes were reported, but no live OBD scanner is connected.";
    return "Fault-code status is unknown because no code was entered or scanner connected.";
  }

  if (q.includes("battery") || q.includes("voltage")) {
    return battery
      ? `${battery.explanation} ${battery.recommended_action || ""}`.trim()
      : "No battery-voltage reading was supplied. Battery condition cannot be assessed.";
  }

  if (q.includes("engine") || q.includes("temp") || q.includes("heat") || q.includes("overheat")) {
    return engine
      ? `${engine.explanation} ${engine.recommended_action || ""}`.trim()
      : "No engine-temperature or fault-code evidence was supplied; the engine is not assessed.";
  }

  if (q.includes("tyre") || q.includes("tire") || q.includes("wheel") || q.includes("rotation")) {
    const tyre = components.find(c => c.component === "tyres");
    return tyre ? tyre.explanation : "No tyre-pressure, tread-depth, or wear readings are available; tyre condition was not assessed.";
  }

  if (!report) return "No report is available. Run an assessment with measured inputs first.";
  return report.top_alert || "No supported readings were assessed.";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VehicleIntelligence({ report, selectedVehicle }) {
  const [auraInput,  setAuraInput]  = useState("");
  const [auraChat,   setAuraChat]   = useState([]);
  const chatEndRef = useRef(null);

  const components = report?.components ?? [];
  const displayCards = components.filter(c => c.risk_score != null);
  const hasIssues = components.some(c => c.urgency === "critical" || c.urgency === "warning")
    || Boolean(selectedVehicle?.has_dtc && selectedVehicle?.dtc_codes);
  const score = report?.overall_health_score == null ? null : Math.round(report.overall_health_score);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [auraChat]);

  const sendAura = (text) => {
    const q = (text || auraInput).trim();
    if (!q) return;
    setAuraChat(p => [...p, { role: "user", text: q }]);
    setAuraInput("");
    setAuraChat(p => [...p, { role: "bot", text: getContextualReply(q, report, selectedVehicle) }]);
  };

  const CHIPS = [
    "What should I service next?",
    score == null ? "What does this assessment mean?" : "Why is my health score low?",
    "Check brake condition",
    selectedVehicle?.has_dtc ? "Explain my fault codes" : "What do fault codes mean?",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden bg-white"
      style={{
        border: `1px solid ${BORDER}`,
        boxShadow: T.shadow,
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ background: T.surface, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: T.blueSoft, border: `1px solid #BFDBFE` }}>
            🧠
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: TEXT }}>Vehicle Intelligence</p>
            <p className="text-xs" style={{ color: MUTED }}>Rule-based screening and report explanation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasIssues && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: `${DANGER}18`, color: DANGER, border: `1px solid ${DANGER}30` }}>
              ⚠ Attention Required
            </span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Predictive Maintenance Cards ─────────────────────────────── */}
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: MUTED }}>
            Rule-based component screening
          </p>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible"
            style={{ scrollbarWidth: "none" }}>
            {displayCards.map((c, i) => {
              const risk = c.risk_score;
              const color = c.urgency === "critical" ? DANGER : c.urgency === "warning" ? WARNING : SUCCESS;
              const label = c.label || c.component || "Service";
              const urgencyLabel = c.urgency || "Assessed";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-4 flex-shrink-0 w-52 sm:w-auto"
                  style={{
                    background: `linear-gradient(135deg, ${color}0D 0%, #FFFFFF 100%)`,
                    border: `1px solid ${color}35`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Glow accent */}
                  <div className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, transform: "translate(20%, -20%)" }} />

                  {/* Badge */}
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium mb-3 inline-block"
                    style={{ background: `${color}20`, color }}>
                    {urgencyLabel}
                  </span>

                  {/* Name */}
                  <p className="font-bold text-sm mb-2 leading-tight" style={{ color: TEXT }}>{label}</p>

                  <p className="text-xs leading-relaxed mb-2" style={{ color: MUTED }}>
                    {c.explanation || "Screened using an explicit threshold rule."}
                  </p>

                  <p className="text-xs" style={{ color: MUTED }}>
                    Rule risk score: <span style={{ color, fontWeight: 600 }}>{risk}/100</span>
                  </p>

                  {c.recommended_action && <p className="text-xs mt-2" style={{ color: TEXT }}>{c.recommended_action}</p>}
                </motion.div>
              );
            })}
          </div>

          {displayCards.length === 0 && (
            <p className="text-xs text-center mt-3" style={{ color: T.faint }}>
              No assessable readings yet. Run diagnostics with measured data to see rule-based results. The ML model is not trained.
            </p>
          )}
        </div>

        {/* ── Attention Banner ─────────────────────────────────────────── */}
        <AnimatePresence>
          {hasIssues && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: `${DANGER}10`, border: `1px solid ${DANGER}30` }}
            >
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: DANGER }}>
                  Your vehicle may require attention
                </p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  Ask below for an explanation of the available assessment and recommendations.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AuraBot ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "#FFFFFF", border: `1px solid ${BORDER}` }}>

          {/* Bot header */}
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ background: T.surface, borderBottom: `1px solid ${BORDER}` }}>
            <span className="text-base">ℹ️</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: TEXT }}>Report explainer</p>
              <p className="text-xs" style={{ color: MUTED }}>Answers use this report and its supplied readings</p>
            </div>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: `${SUCCESS}15`, color: SUCCESS }}>
              Rule based
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Quick chips */}
            <div className="flex flex-wrap gap-2">
              {CHIPS.map(chip => (
                <button key={chip}
                  onClick={() => sendAura(chip)}
                  className="px-3 py-1.5 rounded-full text-xs transition-all"
                  style={{ background: SURFACE, color: MUTED, border: `1px solid ${BORDER}` }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.color = PRIMARY; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER;  e.currentTarget.style.color = MUTED; }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat window */}
            <div className="rounded-xl p-3 space-y-3 overflow-y-auto"
              style={{ background: BG, minHeight: 80, maxHeight: 240 }}>
              {auraChat.length === 0 ? (
                <p className="text-sm italic text-center py-4" style={{ color: T.faint }}>
                  Select a prompt above or type your question below
                </p>
              ) : (
                auraChat.map((m, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="px-3.5 py-2.5 text-sm max-w-sm"
                      style={{
                        background: m.role === "user"
                          ? `linear-gradient(135deg, ${PRIMARY}, ${T.cyan})`
                          : "#FFFFFF",
                        color:      m.role === "user" ? "#FFFFFF" : TEXT,
                        border:     m.role === "user" ? "none" : `1px solid ${BORDER}`,
                        borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        lineHeight: 1.5,
                      }}>
                      {m.text}
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: "#FFFFFF", border: `1px solid ${BORDER}`, color: TEXT }}
                placeholder="Ask about this assessment..."
                value={auraInput}
                onChange={e => setAuraInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendAura()}
                onFocus={e => (e.target.style.borderColor = PRIMARY)}
                onBlur={e  => (e.target.style.borderColor = BORDER)}
              />
              <button onClick={() => sendAura()}
                className="px-5 py-3 rounded-xl font-semibold text-sm flex-shrink-0 transition-all"
                style={{
                  background: auraInput.trim()
                    ? `linear-gradient(135deg, ${PRIMARY}, ${T.cyan})`
                    : SURFACE,
                  color: auraInput.trim() ? "#FFFFFF" : MUTED,
                  boxShadow: auraInput.trim() ? "0 8px 20px rgba(37,99,235,0.22)" : "none",
                }}>
                Ask
              </button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
