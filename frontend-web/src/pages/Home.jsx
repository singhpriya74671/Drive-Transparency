import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";
import { useAuth } from "../context/AuthContext";

// ─── Theme ───────────────────────────────────────────────────────────────────
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

// ─── Mock data (used when no real report is loaded) ──────────────────────────
const HEALTH_TREND = [68, 72, 74, 70, 78, 81, 87];   // last 7 weeks
const COST_TREND   = [1200, 0, 3500, 800, 0, 2200];  // last 6 months ₹
const MONTHS       = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

const MOCK_RECOMMENDATIONS = [
  { label: "Brake Inspection",  urgency: "critical", detail: "Brake pads worn to 20% remaining." },
  { label: "Engine Oil Change", urgency: "warning",  detail: "Oil change overdue by 2,000 km." },
  { label: "Tyre Rotation",     urgency: "good",     detail: "Rotation recommended at 50,000 km." },
];

const MOCK_CHECKLIST = [
  { label: "Engine Oil",      done: true  },
  { label: "Tyre Inspection", done: true  },
  { label: "Battery Check",   done: false },
  { label: "AC Maintenance",  done: false },
];

const MOCK_CENTERS = [
  { name: "ABC Motors",      dist: "2.1 km", rating: 4.8, reviews: 142 },
  { name: "AutoCare Hub",    dist: "3.4 km", rating: 4.7, reviews:  89 },
  { name: "QuickFix Garage", dist: "4.2 km", rating: 4.5, reviews: 211 },
];

const AURA_RESPONSES = {
  oil:     "Based on mileage intervals, an engine oil change is recommended every 5,000–10,000 km. If your last change was over 6 months ago, schedule one soon.",
  brake:   "Brake pads typically last 40,000–70,000 km. Squealing sounds or reduced response are warning signs — inspect immediately.",
  battery: "Car batteries last 2–4 years. If yours is older than 2 years, request a load test at your next service visit.",
  tyre:    "Tyre rotation every 10,000 km ensures even wear. Check pressure monthly for optimal fuel efficiency and tyre longevity.",
  next:    "Next month I recommend: 1) Brake inspection (high urgency), 2) Engine oil change (due soon), 3) Battery load test. These three services will improve safety and health score significantly.",
  default: "Ask me about oil changes, brake condition, battery life, tyre maintenance, or what to service next. I am here to help you stay ahead of breakdowns.",
};

function getBotReply(msg) {
  const q = msg.toLowerCase();
  if (q.includes("oil") || q.includes("engine"))  return AURA_RESPONSES.oil;
  if (q.includes("brake") || q.includes("braking")) return AURA_RESPONSES.brake;
  if (q.includes("battery"))                       return AURA_RESPONSES.battery;
  if (q.includes("tyre") || q.includes("tire") || q.includes("wheel")) return AURA_RESPONSES.tyre;
  if (q.includes("next") || q.includes("month") || q.includes("what") || q.includes("service")) return AURA_RESPONSES.next;
  return AURA_RESPONSES.default;
}

// ─── Mini chart components ────────────────────────────────────────────────────
function LineChart({ data, color }) {
  const W = 400; const H = 90; const p = 8;
  const lo = Math.min(...data) - 5; const hi = Math.max(...data) + 5;
  const pts = data.map((v, i) => ({
    x: p + (i / (data.length - 1)) * (W - p * 2),
    y: H - p - ((v - lo) / (hi - lo)) * (H - p * 2),
  }));
  const path = pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  const area = `${path} L ${pts[pts.length-1].x} ${H} L ${pts[0].x} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill={color} />)}
    </svg>
  );
}

function BarChart({ data, labels, color }) {
  const W = 400; const H = 90; const p = 8;
  const mx = Math.max(...data, 1);
  const bw = (W - p * 2) / data.length - 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }}>
      {data.map((v, i) => {
        const bh = v > 0 ? ((v / mx) * (H - p * 2 - 14)) : 3;
        const x  = p + i * ((W - p * 2) / data.length) + 4;
        const y  = H - p - 12 - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={bh} rx="4" fill={color} opacity={v > 0 ? 0.85 : 0.15} />
            <text x={x + bw / 2} y={H - 2} textAnchor="middle" fontSize="9" fill={MUTED}>{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function Gauge({ score = 87, size = 200 }) {
  const color = score >= 75 ? SUCCESS : score >= 50 ? WARNING : DANGER;
  const legend = score >= 75 ? "🟢 Excellent" : score >= 50 ? "🟡 Average" : "🔴 Critical";
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={SURFACE} strokeWidth="3.5" />
          <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.5s", filter: `drop-shadow(0 0 5px ${color}99)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span style={{ fontSize: size * 0.2, fontWeight: 900, color: TEXT, lineHeight: 1.1 }}>{score}</span>
          <span style={{ fontSize: size * 0.09, color: MUTED }}>/ 100</span>
        </div>
      </div>
      <p className="font-semibold text-sm">{legend}</p>
      <div className="flex gap-4 text-xs" style={{ color: MUTED }}>
        <span>🟢 75–100 Excellent</span>
        <span>🟡 50–74 Average</span>
        <span>🔴 0–49 Critical</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { report, selectedVehicle } = useVehicle();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checklist, setChecklist] = useState(MOCK_CHECKLIST);
  const [auraInput, setAuraInput] = useState("");
  const [auraChat,  setAuraChat]  = useState([]);
  const [auraLoading, setAuraLoading] = useState(false);

  // Derive real data from report when available
  const healthScore  = report ? Math.round(report.overall_health_score) : 87;
  const mileage      = selectedVehicle?.mileage_km || 45000;
  const servicesDue  = report ? report.components.filter(c => c.urgency !== "good").length : 3;
  const costEst      = report
    ? report.components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_min : 0), 0)
    : 3500;
  const recommendations = report
    ? report.components.slice().sort((a, b) => (a.urgency === "critical" ? -1 : a.urgency === "warning" ? 0 : 1)).slice(0, 3)
    : MOCK_RECOMMENDATIONS;

  const urgencyColor = (u) => u === "critical" ? DANGER : u === "warning" ? WARNING : SUCCESS;
  const urgencyDot   = (u) => u === "critical" ? "🔴" : u === "warning" ? "🟡" : "🟢";
  const urgencyLabel = (u) => u === "critical" ? "High Priority" : u === "warning" ? "Medium Priority" : "Low Priority";

  const sendAura = () => {
    if (!auraInput.trim()) return;
    const q = auraInput.trim();
    setAuraChat(p => [...p, { role: "user", text: q }]);
    setAuraInput("");
    setAuraLoading(true);
    setTimeout(() => {
      setAuraChat(p => [...p, { role: "bot", text: getBotReply(q) }]);
      setAuraLoading(false);
    }, 800);
  };

  return (
    <div style={{ background: BG, color: TEXT, minHeight: "100vh" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: 480 }}>

        {/* Background gradient */}
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, #1C1C1C 0%, #232018 50%, #1C1C1C 100%)`,
        }} />

        {/* Spotlight glow behind car */}
        <div className="absolute pointer-events-none" style={{
          right: "5%", bottom: 0,
          width: 600, height: 400,
          background: `radial-gradient(ellipse at 60% 90%, ${PRIMARY}18 0%, transparent 65%)`,
        }} />

        {/* Subtle HUD grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(${BORDER}22 1px, transparent 1px), linear-gradient(90deg, ${BORDER}22 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "linear-gradient(to right, transparent 0%, black 30%, black 60%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30%, black 60%, transparent 100%)",
        }} />

        {/* Car silhouette SVG — detailed side profile */}
        <div className="absolute pointer-events-none select-none" style={{
          right: 0, bottom: 0, opacity: 0.18,
        }}>
          <svg viewBox="0 0 640 260" width="640" height="260">
            <defs>
              <linearGradient id="carGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PRIMARY} stopOpacity="1" />
                <stop offset="100%" stopColor={PRIMARY} stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Body */}
            <path d="M80,180 L80,200 L560,200 L560,180 L520,180 L500,150 L460,130 L380,115 L260,115 L200,130 L160,150 L120,180 Z" fill="url(#carGrad)" />
            {/* Roof/cabin */}
            <path d="M200,130 L220,108 L240,95 L380,95 L420,108 L460,130 Z" fill={PRIMARY} opacity="0.7" />
            {/* Windshield */}
            <path d="M222,128 L238,100 L290,96 L290,128 Z" fill={BG} opacity="0.5" />
            {/* Rear window */}
            <path d="M350,96 L415,110 L430,128 L350,128 Z" fill={BG} opacity="0.5" />
            {/* Front wheel */}
            <circle cx="170" cy="202" r="38" fill={PRIMARY} opacity="0.9" />
            <circle cx="170" cy="202" r="22" fill="#1A1A1A" />
            <circle cx="170" cy="202" r="10" fill={PRIMARY} opacity="0.6" />
            {/* Rear wheel */}
            <circle cx="460" cy="202" r="38" fill={PRIMARY} opacity="0.9" />
            <circle cx="460" cy="202" r="22" fill="#1A1A1A" />
            <circle cx="460" cy="202" r="10" fill={PRIMARY} opacity="0.6" />
            {/* Headlight */}
            <ellipse cx="102" cy="168" rx="18" ry="10" fill={PRIMARY} opacity="0.8" />
            {/* Tail light */}
            <rect x="538" y="155" width="18" height="20" rx="3" fill={DANGER} opacity="0.7" />
            {/* Door lines */}
            <line x1="300" y1="128" x2="298" y2="178" stroke={BG} strokeWidth="2" opacity="0.4" />
            {/* Bumper */}
            <rect x="76" y="185" width="30" height="10" rx="3" fill={PRIMARY} opacity="0.5" />
            <rect x="534" y="185" width="30" height="10" rx="3" fill={PRIMARY} opacity="0.5" />
          </svg>
        </div>

        {/* Hero content */}
        <div className="relative max-w-5xl mx-auto px-6 py-20 flex flex-col justify-center" style={{ minHeight: 480 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{ maxWidth: 560 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6"
              style={{ background: `${PRIMARY}18`, color: PRIMARY, border: `1px solid ${PRIMARY}33` }}>
              ◈ AI-Powered Vehicle Intelligence
            </div>
            <h1 className="font-black leading-tight mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: TEXT }}>
              Keep Your Vehicle<br />
              <span style={{ color: PRIMARY }}>Healthy</span>
            </h1>
            <p className="text-base mb-3" style={{ color: MUTED }}>AI-driven maintenance insights — predict issues before breakdowns.</p>
            <p className="text-sm mb-8" style={{ color: "#5C5652" }}>8-component health scan · Cost estimates · Service reminders</p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate(user ? "/input" : "/login")}
                className="px-7 py-3.5 rounded-xl font-bold text-sm"
                style={{ background: PRIMARY, color: BG }}
              >
                + Add Vehicle
              </button>
              <button
                onClick={() => navigate(user ? "/input" : "/login")}
                className="px-7 py-3.5 rounded-xl font-semibold text-sm"
                style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}
              >
                🔍 Analyze Now
              </button>
              <button
                onClick={() => navigate("/car-mode")}
                className="px-7 py-3.5 rounded-xl font-semibold text-sm"
                style={{ background: "transparent", color: PRIMARY, border: `1px solid ${PRIMARY}44` }}
              >
                🚘 OBD / Car Mode
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STAT CARDS ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "❤️", label: "Health Score",   value: `${healthScore}/100`, color: healthScore >= 75 ? SUCCESS : WARNING },
            { icon: "🔧", label: "Services Due",   value: `${servicesDue} Due`, color: servicesDue > 0 ? WARNING : SUCCESS },
            { icon: "📊", label: "Mileage",         value: `${(mileage/1000).toFixed(0)}k km`,   color: PRIMARY },
            { icon: "💰", label: "Cost Estimate",   value: `₹${costEst.toLocaleString()}`,        color: PRIMARY },
          ].map(({ icon, label, value, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-5 text-center"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="text-3xl mb-2">{icon}</div>
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HEALTH GAUGE + RECOMMENDATIONS ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Gauge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-8 flex flex-col items-center justify-center"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs uppercase tracking-widest mb-6" style={{ color: MUTED }}>Vehicle Health Score</p>
            <Gauge score={healthScore} size={200} />
            {report && (
              <button
                onClick={() => navigate("/dashboard")}
                className="mt-5 text-xs underline"
                style={{ color: PRIMARY }}
              >
                View Full Report →
              </button>
            )}
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <p className="text-xs uppercase tracking-widest mb-5" style={{ color: MUTED }}>Service Recommendations</p>
            <div className="space-y-3">
              {recommendations.map((r, i) => {
                const ug = r.urgency || (i === 0 ? "critical" : i === 1 ? "warning" : "good");
                return (
                  <div
                    key={r.label || r.component}
                    className="flex items-center justify-between p-3.5 rounded-xl"
                    style={{ background: `${urgencyColor(ug)}10`, border: `1px solid ${urgencyColor(ug)}33` }}
                  >
                    <div className="flex items-center gap-3">
                      <span>{urgencyDot(ug)}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: TEXT }}>{r.label || r.component?.replace(/_/g, " ")}</p>
                        {(r.detail || r.explanation) && (
                          <p className="text-xs mt-0.5" style={{ color: MUTED }}>{r.detail || r.explanation}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full flex-shrink-0 font-medium"
                      style={{ background: `${urgencyColor(ug)}22`, color: urgencyColor(ug) }}
                    >
                      {urgencyLabel(ug)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => navigate("/history")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: PRIMARY, color: BG }}
              >
                Book Service
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}
              >
                View Report
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── QUICK ACTIONS ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "📅", label: "Book Service",           sub: "Schedule an appointment",   to: "/history" },
            { icon: "📋", label: "Maintenance Checklist",  sub: "View your service plan",    to: "/dashboard" },
            { icon: "📈", label: "Health Report",          sub: "Full AI analysis",          to: "/dashboard" },
            { icon: "📍", label: "Nearby Service Centers", sub: "Find garages near you",     to: "#centers" },
          ].map(({ icon, label, sub, to }) => (
            <motion.button
              key={label}
              whileHover={{ scale: 1.03 }}
              onClick={() => to.startsWith("#") ? document.getElementById("centers")?.scrollIntoView({ behavior: "smooth" }) : navigate(to)}
              className="rounded-2xl p-5 text-left flex items-start gap-3 w-full"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: TEXT }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{sub}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── HEALTH ANALYTICS ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <p className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Health Analytics</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: TEXT }}>Health Trend</p>
              <span className="text-xs" style={{ color: MUTED }}>Last 7 weeks</span>
            </div>
            <LineChart data={report ? HEALTH_TREND.map((_, i) => Math.min(100, healthScore - (HEALTH_TREND.length - 1 - i) * 2.5)) : HEALTH_TREND} color={SUCCESS} />
            <div className="flex justify-between text-xs mt-2" style={{ color: MUTED }}>
              {["W1","W2","W3","W4","W5","W6","W7"].map(w => <span key={w}>{w}</span>)}
            </div>
          </div>
          <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: TEXT }}>Service Cost (₹)</p>
              <span className="text-xs" style={{ color: MUTED }}>Last 6 months</span>
            </div>
            <BarChart data={COST_TREND} labels={MONTHS} color={PRIMARY} />
            <p className="text-xs mt-2 text-right" style={{ color: MUTED }}>
              Total: ₹{COST_TREND.reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {/* ── MAINTENANCE CHECKLIST + AURABOT ───────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Checklist */}
          <div className="rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Maintenance Checklist</p>
            <div className="space-y-3">
              {checklist.map((item, i) => (
                <label
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: item.done ? "#4CAF7D12" : SURFACE,
                    border:     `1px solid ${item.done ? SUCCESS + "44" : BORDER}`,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => setChecklist(p => p.map((x, j) => j === i ? { ...x, done: !x.done } : x))}
                    className="hidden"
                  />
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      background: item.done ? SUCCESS : "transparent",
                      border:     `2px solid ${item.done ? SUCCESS : MUTED}`,
                    }}
                  >
                    {item.done && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                  </div>
                  <span className="text-sm" style={{ color: item.done ? MUTED : TEXT, textDecoration: item.done ? "line-through" : "none" }}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs mt-4" style={{ color: MUTED }}>
              {checklist.filter(c => c.done).length} / {checklist.length} completed
            </p>
          </div>

          {/* AuraBot */}
          <div className="rounded-2xl p-6 flex flex-col" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🤖</span>
              <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>AI Assistant — AuraBot</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ maxHeight: 200, minHeight: 120 }}>
              {auraChat.length === 0 ? (
                <div className="text-sm italic text-center py-4" style={{ color: MUTED }}>
                  "What should I service next month?"
                </div>
              ) : (
                auraChat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="px-3.5 py-2.5 rounded-2xl text-sm max-w-xs"
                      style={{
                        background: m.role === "user" ? PRIMARY : SURFACE,
                        color:      m.role === "user" ? BG     : TEXT,
                        borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              {auraLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ background: SURFACE, color: MUTED }}>
                    Analysing...
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }}
                placeholder="Ask AuraBot anything about your vehicle..."
                value={auraInput}
                onChange={e => setAuraInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendAura()}
                onFocus={e => (e.target.style.borderColor = PRIMARY)}
                onBlur={e  => (e.target.style.borderColor = BORDER)}
              />
              <button
                onClick={sendAura}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm flex-shrink-0"
                style={{ background: PRIMARY, color: BG }}
              >
                Ask
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── NEARBY SERVICE CENTERS ────────────────────────────────────────── */}
      <section id="centers" className="max-w-5xl mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>Nearby Service Centers</p>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: SURFACE, color: MUTED }}>Coming Soon</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MOCK_CENTERS.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-5"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span style={{ fontSize: 22 }}>📍</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: TEXT }}>{c.name}</p>
                  <p className="text-xs" style={{ color: MUTED }}>{c.dist}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm">
                  <span style={{ color: "#D4935E" }}>⭐</span>
                  <span style={{ color: TEXT, fontWeight: 600 }}>{c.rating}</span>
                  <span style={{ color: MUTED, fontSize: 11 }}>({c.reviews})</span>
                </div>
                <button
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: SURFACE, color: PRIMARY, border: `1px solid ${BORDER}` }}
                >
                  Book →
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { title: "Product",  links: ["Vehicle Health Reports", "Predictive Maintenance", "Service Booking", "Car Display Mode"] },
              { title: "Features", links: ["AI Analysis", "OBD Connect", "Health Gauge", "AuraBot AI"] },
              { title: "Support",  links: ["How It Works", "FAQ", "Contact Us", "Feedback"] },
              { title: "Company",  links: ["About Drive Transparency", "Privacy Policy", "Terms of Use", "Careers"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="font-semibold text-sm mb-3" style={{ color: TEXT }}>{title}</p>
                {links.map(l => (
                  <p key={l} className="text-xs mb-2 cursor-pointer hover:opacity-80" style={{ color: MUTED }}>{l}</p>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-2.5">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="9" fill={PRIMARY} />
                <path d="M6 23 A10 10 0 0 1 26 23" stroke="#1C1C1C" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="16" y1="23" x2="10" y2="12" stroke="#1C1C1C" strokeWidth="2.4" strokeLinecap="round" />
                <circle cx="16" cy="23" r="2.5" fill="#1C1C1C" />
                <line x1="24" y1="15" x2="22.4" y2="16.5" stroke="#1C1C1C" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="8"  y1="15" x2="9.6"  y2="16.5" stroke="#1C1C1C" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="font-bold text-sm tracking-wide" style={{ color: TEXT }}>Drive Transparency</span>
            </div>
            <p className="text-xs" style={{ color: "#555" }}>
              © 2026 Drive Transparency · AI-Powered Vehicle Health Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
