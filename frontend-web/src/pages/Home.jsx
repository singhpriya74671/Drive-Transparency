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

const openNearbyMaps = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        window.open(
          `https://www.google.com/maps/search/car+service+center/@${latitude},${longitude},14z`,
          "_blank"
        );
      },
      () => {
        window.open("https://www.google.com/maps/search/car+service+center+near+me", "_blank");
      }
    );
  } else {
    window.open("https://www.google.com/maps/search/car+service+center+near+me", "_blank");
  }
};

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
  const [carBrand,  setCarBrand]  = useState("");
  const [auraLoading, setAuraLoading] = useState(false);

  // Derive real data from report when available
  const healthScore  = report ? Math.round(report.overall_health_score) : 0;
  const mileage      = selectedVehicle?.mileage_km || 0;
  const servicesDue  = report ? report.components.filter(c => c.urgency !== "good").length : 0;
  const costEst      = report
    ? report.components.reduce((s, c) => s + (c.urgency !== "good" ? c.estimated_cost_min : 0), 0)
    : 0;
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

        {/* Hero content — 2-column */}
        <div className="relative max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-8 justify-between" style={{ minHeight: 420 }}>

          {/* Left: text + CTAs */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ maxWidth: 480, flex: 1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-5"
              style={{ background: `${PRIMARY}18`, color: PRIMARY, border: `1px solid ${PRIMARY}33` }}>
              ◈ AI-Powered Vehicle Intelligence
            </div>
            <h1 className="font-black leading-tight mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: TEXT }}>
              Keep Your Vehicle<br /><span style={{ color: PRIMARY }}>Healthy</span>
            </h1>
            <p className="text-sm mb-2" style={{ color: MUTED }}>AI-driven maintenance insights — predict issues before breakdowns.</p>
            <p className="text-xs mb-7" style={{ color: "#5C5652" }}>8-component health scan · Cost estimates · Service reminders</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate(user ? "/input" : "/login")}
                className="px-6 py-3 rounded-xl font-bold text-sm"
                style={{ background: PRIMARY, color: BG }}>
                {report ? "🔄 Re-analyze" : "+ Add Vehicle"}
              </button>
              {report && (
                <button onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
                  📊 View Dashboard
                </button>
              )}
              <button onClick={() => navigate("/car-mode")}
                className="px-6 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "transparent", color: PRIMARY, border: `1px solid ${PRIMARY}44` }}>
                🚘 Car Mode
              </button>
            </div>
          </motion.div>

          {/* Right: live vehicle status card */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="rounded-2xl p-5 flex-shrink-0 w-full md:w-72"
            style={{ background: "#272727CC", border: `1px solid ${BORDER}`, backdropFilter: "blur(12px)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>
                {report ? "Vehicle Connected" : "Demo Status"}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{ background: `${SUCCESS}18`, color: SUCCESS }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: SUCCESS }}></span>
                {report ? "Live" : "Demo"}
              </span>
            </div>
            {report && selectedVehicle && (
              <p className="text-sm font-semibold mb-3" style={{ color: TEXT }}>{selectedVehicle.vehicle_model}</p>
            )}
            <div className="space-y-3">
              {[
                { label: "Health Score", value: `${healthScore}/100`, color: healthScore >= 75 ? SUCCESS : healthScore >= 50 ? WARNING : DANGER },
                { label: "Next Service",  value: report ? (report.components.find(c => c.urgency !== "good" && c.predicted_service_window_days) ? `${report.components.filter(c => c.urgency !== "good").sort((a,b) => (a.predicted_service_window_days??999)-(b.predicted_service_window_days??999))[0]?.predicted_service_window_days ?? 30} Days` : "Scheduled") : "30 Days", color: WARNING },
                { label: "AI Risk Level", value: report ? (report.overall_status === "critical" ? "High" : report.overall_status === "warning" ? "Medium" : "Low") : "Low", color: report?.overall_status === "critical" ? DANGER : report?.overall_status === "warning" ? WARNING : SUCCESS },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: SURFACE }}>
                  <span className="text-xs" style={{ color: MUTED }}>{label}</span>
                  <span className="text-sm font-bold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => navigate(user ? "/input" : "/login")}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: PRIMARY, color: BG }}>
                Run Diagnostic
              </button>
              <button onClick={() => document.getElementById("centers")?.scrollIntoView({ behavior: "smooth" })}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
                Book Service
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── AI PREDICTION PANEL ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-4">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span>🤖</span>
              <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>AI Predictive Maintenance</p>
            </div>
            {report && (
              <button onClick={() => navigate("/dashboard")}
                className="text-xs px-3 py-1.5 rounded-lg"
                style={{ background: SURFACE, color: PRIMARY, border: `1px solid ${BORDER}` }}>
                Full Report →
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(report
              ? report.components.filter(c => c.maintenance_probability != null).sort((a,b) => b.maintenance_probability - a.maintenance_probability).slice(0,3)
              : [
                  { label: "Brake Service",    maintenance_probability: 87, predicted_service_window_days: 30,  urgency: "critical" },
                  { label: "Tyre Replacement", maintenance_probability: 91, predicted_service_window_days: 45,  urgency: "critical" },
                  { label: "Battery Check",    maintenance_probability: 74, predicted_service_window_days: 90,  urgency: "warning"  },
                ]
            ).map((c, i) => {
              const prob  = c.maintenance_probability ?? 0;
              const days  = c.predicted_service_window_days ?? 180;
              const color = prob >= 70 ? DANGER : prob >= 40 ? WARNING : SUCCESS;
              const label = c.label || c.component;
              const window = days <= 7 ? "This week" : days <= 30 ? `${days} days` : `${Math.round(days/30)} months`;
              return (
                <div key={i} className="rounded-xl p-4" style={{ background: `${color}10`, border: `1px solid ${color}28` }}>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-semibold" style={{ color: TEXT }}>{label}</p>
                    <span className="text-lg font-black" style={{ color }}>{prob}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: SURFACE }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }} whileInView={{ width: `${prob}%` }} viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      style={{ background: color }} />
                  </div>
                  <p className="text-xs" style={{ color: MUTED }}>Expected: <span style={{ color }}>{window}</span></p>
                </div>
              );
            })}
          </div>
          {!report && (
            <p className="text-xs text-center mt-3" style={{ color: "#555" }}>
              Demo data shown · <span className="underline cursor-pointer" style={{ color: PRIMARY }}
                onClick={() => navigate(user ? "/input" : "/login")}>Add your vehicle</span> to see real predictions
            </p>
          )}
        </motion.div>
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

      {/* ── MAINTENANCE CHECKLIST ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <div className="rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <p className="text-xs uppercase tracking-widest mb-4" style={{ color: MUTED }}>Maintenance Checklist</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </section>

      {/* ── NEARBY SERVICE CENTERS ────────────────────────────────────────── */}
      <section id="centers" className="max-w-5xl mx-auto px-6 pb-12">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>Nearby Service Centers</p>
          <p className="text-sm mt-1" style={{ color: "#666" }}>Choose the type of service center that suits you</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Authorized */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: CARD, border: `1px solid #4CAF7D44` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "#4CAF7D18" }}>🏢</div>
              <div>
                <p className="font-bold text-sm" style={{ color: TEXT }}>Authorized Service Centers</p>
                <p className="text-xs mt-0.5" style={{ color: "#4CAF7D" }}>Official brand-only centers</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {["Genuine spare parts", "Manufacturer warranty honored", "Trained technicians", "Higher cost, higher trust"].map(t => (
                <li key={t} className="text-xs flex items-center gap-2" style={{ color: MUTED }}>
                  <span style={{ color: "#4CAF7D" }}>✓</span> {t}
                </li>
              ))}
            </ul>
            {/* Brand selector */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: MUTED }}>Select your car brand:</p>
              <select
                value={carBrand}
                onChange={e => setCarBrand(e.target.value)}
                style={{
                  width: "100%", background: SURFACE, border: `1px solid ${carBrand ? "#4CAF7D" : BORDER}`,
                  borderRadius: 10, padding: "8px 12px", color: carBrand ? TEXT : MUTED,
                  fontSize: "0.85rem", outline: "none", fontFamily: "inherit",
                }}
              >
                <option value="">-- Choose brand --</option>
                {["Maruti Suzuki","Hyundai","Tata","Honda","Toyota","Mahindra","Kia","MG","Renault","Nissan","Volkswagen","Skoda","Ford","Jeep","BMW","Mercedes-Benz","Audi","Volvo","Fiat","Mitsubishi"].map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                const q = carBrand ? `${carBrand} authorized service center` : "authorized car service center";
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    ({ coords }) => window.open(`https://www.google.com/maps/search/${encodeURIComponent(q)}/@${coords.latitude},${coords.longitude},14z`, "_blank"),
                    () => window.open(`https://www.google.com/maps/search/${encodeURIComponent(q + " near me")}`, "_blank")
                  );
                } else window.open(`https://www.google.com/maps/search/${encodeURIComponent(q + " near me")}`, "_blank");
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold mt-auto"
              style={{ background: "#4CAF7D", color: "#1C1C1C", opacity: carBrand ? 1 : 0.6 }}
            >
              📍 {carBrand ? `Find ${carBrand} Centers` : "Select Brand First"}
            </button>
          </motion.div>

          {/* Local */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: CARD, border: `1px solid #D4935E44` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: "#D4935E18" }}>🔧</div>
              <div>
                <p className="font-bold text-sm" style={{ color: TEXT }}>Local / Street Garages</p>
                <p className="text-xs mt-0.5" style={{ color: "#D4935E" }}>Independent mechanics</p>
              </div>
            </div>
            <ul className="space-y-1.5">
              {["Faster turnaround time", "More affordable pricing", "Flexible with local parts", "Best for routine repairs"].map(t => (
                <li key={t} className="text-xs flex items-center gap-2" style={{ color: MUTED }}>
                  <span style={{ color: "#D4935E" }}>✓</span> {t}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    ({ coords }) => window.open(`https://www.google.com/maps/search/car+garage+mechanic+near+me/@${coords.latitude},${coords.longitude},14z`, "_blank"),
                    () => window.open("https://www.google.com/maps/search/car+garage+mechanic+near+me", "_blank")
                  );
                } else window.open("https://www.google.com/maps/search/car+garage+mechanic+near+me", "_blank");
              }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold mt-auto"
              style={{ background: "#D4935E", color: "#1C1C1C" }}
            >
              📍 Find Local Garages
            </button>
          </motion.div>

        </div>
        <p className="text-xs text-center mt-3" style={{ color: "#555" }}>Opens Google Maps · Your location is never stored on our servers</p>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div className="max-w-5xl mx-auto px-6 py-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { title: "Product", links: [
                { label: "Vehicle Health Reports", action: () => navigate("/dashboard") },
                { label: "Predictive Maintenance",  action: () => navigate("/dashboard") },
                { label: "Service History",         action: () => navigate("/history") },
                { label: "Car Display Mode",        action: () => navigate("/car-mode") },
              ]},
              { title: "Features", links: [
                { label: "AI Analysis",     action: () => navigate("/input") },
                { label: "OBD Diagnostics", action: () => navigate("/input") },
                { label: "Health Gauge",    action: () => navigate("/dashboard") },
                { label: "Nearby Centers",  action: () => document.getElementById("centers")?.scrollIntoView({ behavior: "smooth" }) },
              ]},
              { title: "Support", links: [
                { label: "How It Works",  action: () => document.getElementById("stats")?.scrollIntoView({ behavior: "smooth" }) },
                { label: "Contact Us",    action: () => window.open("mailto:karn.dronex@gmail.com?subject=Drive Transparency Support", "_blank") },
                { label: "GitHub",        action: () => window.open("https://github.com/singhpriya74671/Drive-Transparency", "_blank") },
                { label: "Feedback",      action: () => window.open("mailto:karn.dronex@gmail.com?subject=Drive Transparency Feedback", "_blank") },
              ]},
              { title: "Company", links: [
                { label: "About Drive Transparency", action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
                { label: "Privacy Policy",           action: () => alert("Your data is stored securely and never shared with third parties.") },
                { label: "Terms of Use",             action: () => alert("Drive Transparency is provided as-is for vehicle health monitoring purposes.") },
                { label: "Open Source",              action: () => window.open("https://github.com/singhpriya74671/Drive-Transparency", "_blank") },
              ]},
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="font-semibold text-sm mb-3" style={{ color: TEXT }}>{title}</p>
                {links.map(({ label, action }) => (
                  <p
                    key={label}
                    onClick={action}
                    className="text-xs mb-2 cursor-pointer transition-all"
                    style={{ color: MUTED }}
                    onMouseEnter={e => e.target.style.color = PRIMARY}
                    onMouseLeave={e => e.target.style.color = MUTED}
                  >
                    {label}
                  </p>
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
