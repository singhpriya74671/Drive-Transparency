import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

// ─── Contextual AI replies ────────────────────────────────────────────────────
function getContextualReply(msg, report, selectedVehicle) {
  const q = msg.toLowerCase();
  const components  = report?.components ?? [];
  const critical    = components.filter(c => c.urgency === "critical");
  const warning     = components.filter(c => c.urgency === "warning");
  const predicted   = components
    .filter(c => c.maintenance_probability != null)
    .sort((a, b) => b.maintenance_probability - a.maintenance_probability);
  const hasFault    = selectedVehicle?.has_dtc && selectedVehicle?.dtc_codes;
  const score       = Math.round(report?.overall_health_score ?? 0);
  const bv          = selectedVehicle?.battery_voltage ?? 12.6;
  const et          = selectedVehicle?.engine_temp_c   ?? 90;

  if (q.includes("next") || q.includes("service") || q.includes("what")) {
    if (predicted.length > 0) {
      const top = predicted[0];
      const days = top.predicted_service_window_days ?? 30;
      const window = days <= 7 ? "this week" : days <= 30 ? `in ${days} days` : `in ${Math.round(days / 30)} months`;
      return `Based on AI analysis, your most urgent service is ${top.label || top.component} at ${(top.maintenance_probability ?? 0).toFixed(0)}% risk — expected ${window}.${critical.length > 0 ? ` You also have ${critical.length} critical component(s) needing immediate attention: ${critical.map(c => c.label || c.component).join(", ")}.` : ""}`;
    }
    return "Your vehicle is in good condition. Keep up with routine oil changes every 5,000–10,000 km and tyre rotation every 10,000 km.";
  }

  if (q.includes("health") || q.includes("score") || q.includes("low") || q.includes("why")) {
    if (score >= 75) return `Your health score of ${score}/100 is Excellent. All major systems are functioning well. Maintain your current service schedule to keep it this way.`;
    if (score >= 50) return `Your health score of ${score}/100 is Average. ${warning.length} component(s) need attention soon: ${warning.map(c => c.label || c.component).join(", ")}. Schedule a service within the next 1–2 months.`;
    return `Your health score of ${score}/100 is Critical. Immediate service is recommended. Components needing urgent attention: ${critical.map(c => c.label || c.component).join(", ")}.`;
  }

  if (q.includes("cost") || q.includes("estimate") || q.includes("price") || q.includes("money") || q.includes("₹")) {
    if (report) {
      const min = components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_min : 0), 0);
      const max = components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_max : 0), 0);
      if (min > 0) {
        const breakdown = components.filter(c => c.urgency !== "good")
          .map(c => `${c.label || c.component}: ₹${c.estimated_cost_min?.toLocaleString("en-IN")}`).join(", ");
        return `Total estimated maintenance cost: ₹${min.toLocaleString("en-IN")} – ₹${max.toLocaleString("en-IN")}. Breakdown: ${breakdown}. Addressing issues early prevents more expensive repairs later.`;
      }
      return "No pending services detected. No immediate costs expected. Your vehicle is in great shape!";
    }
    return "Add your vehicle first to get accurate AI cost estimates based on your specific model, mileage, and condition.";
  }

  if (q.includes("brake")) {
    const brake = components.find(c => c.component === "brakes");
    if (brake) return `Brake status: ${brake.urgency.toUpperCase()}. ${brake.explanation} Estimated cost: ₹${brake.estimated_cost_min?.toLocaleString("en-IN")} – ₹${brake.estimated_cost_max?.toLocaleString("en-IN")}. ${brake.urgency === "critical" ? "Do not delay — faulty brakes are a safety hazard." : "Monitor closely and schedule within 1–2 months."}`;
    return "Brake pads typically last 40,000–70,000 km. Warning signs: squealing sounds, vibration when braking, or longer stopping distances. Inspect immediately if any of these appear.";
  }

  if (q.includes("fault") || q.includes("dtc") || q.includes("code") || q.includes("p0")) {
    if (hasFault) return `Active fault codes detected: ${selectedVehicle.dtc_codes}. These indicate a system fault. Bring your vehicle to a service center for a full OBD scan. Do not ignore active fault codes — they can lead to further engine damage.`;
    return "No active fault codes detected. Your OBD system is clear. If your check engine light turns on, bring the vehicle in for an OBD scan immediately.";
  }

  if (q.includes("battery") || q.includes("voltage")) {
    const status = bv >= 12.4 ? "Good — healthy charge" : bv >= 11.8 ? "Low — get it tested soon" : "Critical — replace immediately";
    return `Battery voltage: ${bv.toFixed(1)}V — ${status}. Batteries typically last 2–4 years. If voltage drops below 12.2V at rest, it's time for a replacement. A failing battery can leave you stranded without warning.`;
  }

  if (q.includes("engine") || q.includes("temp") || q.includes("heat") || q.includes("overheat")) {
    const status = et <= 95 ? "Normal range (80–95°C)" : et <= 110 ? "Slightly warm — monitor coolant" : "OVERHEATING — stop and cool down immediately";
    return `Engine temperature: ${et.toFixed(0)}°C — ${status}. Consistently high temps can indicate low coolant, a faulty thermostat, or a blocked radiator. Have it inspected if temperature stays above 100°C regularly.`;
  }

  if (q.includes("tyre") || q.includes("tire") || q.includes("wheel") || q.includes("rotation")) {
    const tyre = components.find(c => c.component === "tyres");
    if (tyre) return `Tyre status: ${tyre.urgency.toUpperCase()}. ${tyre.explanation} Cost estimate: ₹${tyre.estimated_cost_min?.toLocaleString("en-IN")} – ₹${tyre.estimated_cost_max?.toLocaleString("en-IN")}.`;
    return "Rotate tyres every 10,000 km for even wear. Check pressure monthly — ideal is 30–35 PSI. Worn tyres below 2mm tread depth should be replaced immediately for safety.";
  }

  // Fallback contextual
  if (predicted.length > 0) {
    const top3 = predicted.slice(0, 3);
    return `Your vehicle has ${predicted.filter(c => (c.maintenance_probability ?? 0) >= 40).length} component(s) flagged by AI. Top concerns: ${top3.map(c => `${c.label || c.component} (${(c.maintenance_probability ?? 0).toFixed(0)}%)`).join(", ")}. Ask me about specific parts, cost estimates, fault codes, or what to service next.`;
  }
  return "Ask me about specific components — brakes, battery, tyres, engine oil — or ask about your health score, cost estimates, fault codes, or what to service next.";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VehicleIntelligence({ report, selectedVehicle }) {
  const [auraInput,  setAuraInput]  = useState("");
  const [auraChat,   setAuraChat]   = useState([]);
  const [auraLoading, setAuraLoading] = useState(false);
  const chatEndRef = useRef(null);

  const predicted = (report?.components ?? [])
    .filter(c => c.maintenance_probability != null)
    .sort((a, b) => b.maintenance_probability - a.maintenance_probability);

  const hasIssues = predicted.some(c => (c.maintenance_probability ?? 0) >= 40)
    || (report?.overall_health_score ?? 100) < 70
    || (selectedVehicle?.has_dtc && selectedVehicle?.dtc_codes);

  const score = Math.round(report?.overall_health_score ?? 0);

  // Show demo cards when no predictions
  const displayCards = predicted.length > 0 ? predicted : [
    { label: "Brake Service",    maintenance_probability: 87, predicted_service_window_days: 30,  urgency: "critical" },
    { label: "Tyre Replacement", maintenance_probability: 91, predicted_service_window_days: 45,  urgency: "critical" },
    { label: "Battery Check",    maintenance_probability: 74, predicted_service_window_days: 90,  urgency: "warning"  },
  ];

  const isDemo = predicted.length === 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [auraChat]);

  const sendAura = (text) => {
    const q = (text || auraInput).trim();
    if (!q) return;
    setAuraChat(p => [...p, { role: "user", text: q }]);
    setAuraInput("");
    setAuraLoading(true);
    setTimeout(() => {
      setAuraChat(p => [...p, { role: "bot", text: getContextualReply(q, report, selectedVehicle) }]);
      setAuraLoading(false);
    }, 700);
  };

  const CHIPS = [
    "What should I service next?",
    score < 75 ? "Why is my health score low?" : "How can I improve my score?",
    "Estimate maintenance cost",
    "Check brake condition",
    selectedVehicle?.has_dtc ? "Explain my fault codes" : "What do fault codes mean?",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(145deg, #232323 0%, #1e1e1e 100%)",
        border: `1px solid ${BORDER}`,
        boxShadow: "0 0 40px rgba(0,0,0,0.4)",
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{ background: "rgba(221,208,200,0.12)", border: `1px solid rgba(221,208,200,0.2)` }}>
            🧠
          </div>
          <div>
            <p className="font-bold text-sm" style={{ color: TEXT }}>Vehicle Intelligence</p>
            <p className="text-xs" style={{ color: MUTED }}>AI Predictive Maintenance + Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasIssues && (
            <span className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: `${DANGER}18`, color: DANGER, border: `1px solid ${DANGER}30` }}>
              ⚠ Attention Required
            </span>
          )}
          {isDemo && (
            <span className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: SURFACE, color: MUTED }}>Demo</span>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Predictive Maintenance Cards ─────────────────────────────── */}
        <div>
          <p className="text-xs uppercase tracking-widest mb-3" style={{ color: MUTED }}>
            AI Predictive Maintenance
          </p>

          {/* Horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible"
            style={{ scrollbarWidth: "none" }}>
            {displayCards.map((c, i) => {
              const prob  = c.maintenance_probability ?? 0;
              const days  = c.predicted_service_window_days ?? 180;
              const color = prob >= 70 ? DANGER : prob >= 40 ? WARNING : SUCCESS;
              const label = c.label || c.component || "Service";
              const window = days <= 7 ? "This week" : days <= 30 ? `${days} days` : `${Math.round(days / 30)} months`;
              const urgencyLabel = prob >= 70 ? "High Risk" : prob >= 40 ? "Monitor" : "Good";

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-4 flex-shrink-0 w-52 sm:w-auto"
                  style={{
                    background: `linear-gradient(135deg, ${color}10 0%, rgba(30,30,30,0.8) 100%)`,
                    border: `1px solid ${color}35`,
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
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

                  {/* Big % */}
                  <p className="text-3xl font-black leading-none mb-2" style={{ color }}>
                    {prob.toFixed(0)}<span className="text-base font-semibold">%</span>
                  </p>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden mb-2"
                    style={{ background: "rgba(255,255,255,0.08)" }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${prob}%` }}
                      transition={{ duration: 0.9, delay: i * 0.1, ease: "easeOut" }}
                      style={{
                        background: `linear-gradient(90deg, ${color}80, ${color})`,
                        boxShadow: `0 0 6px ${color}80`,
                      }} />
                  </div>

                  {/* Timeline */}
                  <p className="text-xs" style={{ color: MUTED }}>
                    Expected: <span style={{ color, fontWeight: 600 }}>{window}</span>
                  </p>

                  {/* Cost hint */}
                  {c.estimated_cost_min != null && (
                    <p className="text-xs mt-1" style={{ color: "#555" }}>
                      Est. ₹{c.estimated_cost_min.toLocaleString("en-IN")}+
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          {isDemo && (
            <p className="text-xs text-center mt-3" style={{ color: "#555" }}>
              Demo data shown · Add your vehicle to see real AI predictions
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
                  Ask AuraBot below for detailed explanations, cost estimates, and recommendations.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── AuraBot ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}` }}>

          {/* Bot header */}
          <div className="px-4 py-3 flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${BORDER}` }}>
            <span className="text-base">🤖</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: TEXT }}>AuraBot</p>
              <p className="text-xs" style={{ color: MUTED }}>Context-aware vehicle assistant</p>
            </div>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: `${SUCCESS}15`, color: SUCCESS }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SUCCESS }}></span>Online
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
                <p className="text-sm italic text-center py-4" style={{ color: "#444" }}>
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
                          ? `linear-gradient(135deg, ${PRIMARY}, #c8bdb5)`
                          : SURFACE,
                        color:      m.role === "user" ? BG : TEXT,
                        borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        lineHeight: 1.5,
                      }}>
                      {m.text}
                    </div>
                  </motion.div>
                ))
              )}
              {auraLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl text-sm flex items-center gap-2"
                    style={{ background: SURFACE, color: MUTED, borderRadius: "18px 18px 18px 4px" }}>
                    <span className="inline-flex gap-1">
                      {[0, 1, 2].map(n => (
                        <motion.span key={n} className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ background: MUTED }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: n * 0.2 }} />
                      ))}
                    </span>
                    Analysing...
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }}
                placeholder="Ask AuraBot about your vehicle..."
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
                    ? `linear-gradient(135deg, ${PRIMARY}, #c8bdb5)`
                    : SURFACE,
                  color: auraInput.trim() ? BG : MUTED,
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
