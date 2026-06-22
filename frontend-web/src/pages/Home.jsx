import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
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

// ─── Animated counter ────────────────────────────────────────────────────────
function CountUp({ target, suffix = "", prefix = "", duration = 1200 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || typeof target !== "number") return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration]);
  return <span ref={ref}>{prefix}{inView && typeof target === "number" ? val : "--"}{suffix}</span>;
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, #3D3D3D)` }} />
      <p className="text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full"
        style={{ color: "#8C8480", background: "#272727", border: "1px solid #3D3D3D" }}>
        {children}
      </p>
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, #3D3D3D, transparent)` }} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const { report, selectedVehicle } = useVehicle();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [checklist,    setChecklist]    = useState(MOCK_CHECKLIST);
  const [newItem,      setNewItem]      = useState("");
  const [auraInput,    setAuraInput]    = useState("");
  const [auraChat,     setAuraChat]     = useState([]);
  const [carBrand,     setCarBrand]     = useState("");

  const addChecklistItem = () => {
    const label = newItem.trim();
    if (!label) return;
    setChecklist(p => [...p, { label, done: false }]);
    setNewItem("");
  };
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

        {/* Animated personalised car */}
        {(() => {
          const mfr = (selectedVehicle?.manufacturer || "").toLowerCase();
          const model = selectedVehicle?.vehicle_model || "";
          // SUV brands get a taller roofline
          const isSUV = ["mahindra","tata","jeep","ford","mg","kia","toyota","hyundai"].some(b => mfr.includes(b));
          const accentColor = mfr.includes("maruti") || mfr.includes("suzuki") ? "#5EB8FF"
            : mfr.includes("hyundai") ? "#4CDFB0"
            : mfr.includes("tata")    ? "#7C5CFF"
            : mfr.includes("honda")   ? "#FF6B6B"
            : mfr.includes("toyota")  ? "#FFD700"
            : mfr.includes("kia")     ? "#FF8C42"
            : mfr.includes("mahindra")? "#FF4D6D"
            : mfr.includes("bmw")     ? "#4C9BE8"
            : mfr.includes("mercedes")? "#C0C0C0"
            : mfr.includes("audi")    ? "#E8A020"
            : PRIMARY;

          // SVG paths: sedan vs SUV roof
          const roofPath = isSUV
            ? "M185,132 L195,100 L210,88 L400,88 L435,100 L455,132 Z"
            : "M200,130 L220,108 L240,95 L380,95 L420,108 L460,130 Z";
          const windshield = isSUV
            ? "M215,130 L226,96 L285,90 L285,130 Z"
            : "M222,128 L238,100 L290,96 L290,128 Z";
          const rearWindow = isSUV
            ? "M345,90 L420,100 L438,130 L345,130 Z"
            : "M350,96 L415,110 L430,128 L350,128 Z";

          return (
            <motion.div
              className="absolute select-none hidden md:block"
              style={{ right: -20, bottom: 0 }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.06, y: -18, filter: `drop-shadow(0 20px 40px ${accentColor}55)` }}
            >
              {/* Model name tag */}
              {model && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute text-center"
                  style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 8, whiteSpace: "nowrap" }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      background: `${accentColor}18`,
                      border: `1px solid ${accentColor}50`,
                      color: accentColor,
                      backdropFilter: "blur(8px)",
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }}></span>
                    {model}
                  </div>
                </motion.div>
              )}

              <svg viewBox="0 0 640 260" width="560" height="228" style={{ filter: `drop-shadow(0 8px 24px ${accentColor}30)` }}>
                <defs>
                  <linearGradient id="carGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity="0.85" />
                    <stop offset="100%" stopColor={accentColor} stopOpacity="0.25" />
                  </linearGradient>
                  <linearGradient id="wheelGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#3a3a3a" />
                    <stop offset="100%" stopColor="#1a1a1a" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* Ground shadow */}
                <ellipse cx="315" cy="215" rx="240" ry="10" fill={accentColor} opacity="0.08" />

                {/* Body */}
                <path d="M80,180 L80,200 L560,200 L560,180 L520,180 L500,150 L460,130 L380,115 L260,115 L200,130 L160,150 L120,180 Z"
                  fill="url(#carGrad2)" />
                {/* Roof */}
                <path d={roofPath} fill={accentColor} opacity="0.75" />
                {/* Windshield */}
                <path d={windshield} fill={BG} opacity="0.45" />
                {/* Rear window */}
                <path d={rearWindow} fill={BG} opacity="0.45" />

                {/* Front wheel */}
                <circle cx="170" cy="202" r="38" fill="url(#wheelGrad)" />
                <circle cx="170" cy="202" r="28" fill="#111" />
                <circle cx="170" cy="202" r="14" fill={accentColor} opacity="0.7" />
                <line x1="170" y1="174" x2="170" y2="230" stroke={accentColor} strokeWidth="2" opacity="0.3" />
                <line x1="142" y1="202" x2="198" y2="202" stroke={accentColor} strokeWidth="2" opacity="0.3" />

                {/* Rear wheel */}
                <circle cx="460" cy="202" r="38" fill="url(#wheelGrad)" />
                <circle cx="460" cy="202" r="28" fill="#111" />
                <circle cx="460" cy="202" r="14" fill={accentColor} opacity="0.7" />
                <line x1="460" y1="174" x2="460" y2="230" stroke={accentColor} strokeWidth="2" opacity="0.3" />
                <line x1="432" y1="202" x2="488" y2="202" stroke={accentColor} strokeWidth="2" opacity="0.3" />

                {/* Headlight glow */}
                <ellipse cx="102" cy="168" rx="20" ry="11" fill={accentColor} opacity="0.9" filter="url(#glow)" />
                <ellipse cx="102" cy="168" rx="12" ry="6" fill="#fff" opacity="0.6" />

                {/* Tail light */}
                <rect x="536" y="152" width="20" height="24" rx="4" fill="#FF4444" opacity="0.85" filter="url(#glow)" />
                <rect x="540" y="156" width="12" height="16" rx="2" fill="#ff6666" opacity="0.6" />

                {/* Door line */}
                <line x1="300" y1="128" x2="298" y2="178" stroke={accentColor} strokeWidth="1.5" opacity="0.25" />
                {/* Window frame detail */}
                <path d={roofPath} fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.35" />

                {/* Bumpers */}
                <rect x="74" y="184" width="32" height="12" rx="4" fill={accentColor} opacity="0.5" />
                <rect x="534" y="184" width="32" height="12" rx="4" fill={accentColor} opacity="0.5" />

                {/* Side stripe accent */}
                <line x1="120" y1="162" x2="500" y2="162" stroke={accentColor} strokeWidth="1.5" opacity="0.2" />
              </svg>
            </motion.div>
          );
        })()}

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
                { label: "Health Score", value: report ? `${healthScore}/100` : "--", color: report ? (healthScore >= 75 ? SUCCESS : healthScore >= 50 ? WARNING : DANGER) : MUTED },
                { label: "Next Service",  value: report ? (report.components.filter(c => c.urgency !== "good").sort((a,b) => (a.predicted_service_window_days??999)-(b.predicted_service_window_days??999))[0]?.predicted_service_window_days ? `${report.components.filter(c => c.urgency !== "good").sort((a,b) => (a.predicted_service_window_days??999)-(b.predicted_service_window_days??999))[0].predicted_service_window_days} Days` : "Scheduled") : "--", color: report ? WARNING : MUTED },
                { label: "AI Risk Level", value: report ? (report.overall_status === "critical" ? "High" : report.overall_status === "warning" ? "Medium" : "Low") : "--", color: report ? (report.overall_status === "critical" ? DANGER : report.overall_status === "warning" ? WARNING : SUCCESS) : MUTED },
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


      {/* ── TRUST BADGES ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-6 pb-2 relative z-10">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: "🤖", label: "XGBoost AI" },
            { icon: "🔌", label: "OBD-II Connect" },
            { icon: "🛡️", label: "8-Component Scan" },
            { icon: "📍", label: "Live GPS Centers" },
            { icon: "⚡", label: "Real-Time Analysis" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
              style={{ background: "#272727", border: "1px solid #3D3D3D", color: "#8C8480" }}>
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>
      </section>

      {/* ── STAT CARDS ────────────────────────────────────────────────────── */}
      <section id="stats" className="max-w-5xl mx-auto px-6 py-6 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "❤️", label: "Health Score",  num: report ? healthScore : null, suffix: "/100", color: report ? (healthScore >= 75 ? SUCCESS : healthScore >= 50 ? WARNING : DANGER) : MUTED, glow: SUCCESS },
            { icon: "🔧", label: "Services Due",  num: report ? servicesDue : null,  suffix: " Due", color: report ? (servicesDue > 0 ? WARNING : SUCCESS) : MUTED, glow: WARNING },
            { icon: "🛣️", label: "Mileage",       num: selectedVehicle ? Math.round(mileage/1000) : null, suffix: "k km", color: selectedVehicle ? PRIMARY : MUTED, glow: PRIMARY },
            { icon: "💰", label: "Cost Estimate", num: report && costEst > 0 ? costEst : null, prefix: "₹", color: report && costEst > 0 ? PRIMARY : MUTED, glow: WARNING },
          ].map(({ icon, label, num, suffix = "", prefix = "", color, glow }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.09 }}
              whileHover={{ y: -4, boxShadow: `0 8px 30px ${glow}22` }}
              className="rounded-2xl p-5 text-center cursor-default transition-all"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-3"
                style={{ background: `${glow}15`, border: `1px solid ${glow}30` }}>
                {icon}
              </div>
              <p className="text-2xl font-black" style={{ color }}>
                {num != null
                  ? <CountUp target={num} suffix={suffix} prefix={prefix} />
                  : "--"}
              </p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HEALTH GAUGE + RECOMMENDATIONS ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <SectionLabel>Vehicle Health</SectionLabel>
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
        <SectionLabel>Quick Actions</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: "📅", label: "Book Service",           sub: "Schedule an appointment",   to: "/history",    accent: WARNING },
            { icon: "📋", label: "Maintenance Checklist",  sub: "View your service plan",    to: "/dashboard",  accent: SUCCESS },
            { icon: "📈", label: "Health Report",          sub: "Full AI analysis",          to: "/dashboard",  accent: PRIMARY },
            { icon: "📍", label: "Service Centers",        sub: "Find garages near you",     to: "#centers",    accent: "#FF6B6B" },
          ].map(({ icon, label, sub, to, accent }) => (
            <motion.button
              key={label}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              whileHover={{ y: -4, boxShadow: `0 12px 32px ${accent}25`, borderColor: accent + "55" }}
              onClick={() => to.startsWith("#") ? document.getElementById("centers")?.scrollIntoView({ behavior: "smooth" }) : navigate(to)}
              className="rounded-2xl p-5 text-left w-full transition-all"
              style={{ background: CARD, border: `1px solid ${BORDER}` }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ background: `${accent}18`, border: `1px solid ${accent}35` }}>
                {icon}
              </div>
              <p className="font-semibold text-sm" style={{ color: TEXT }}>{label}</p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>{sub}</p>
              <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: accent }}>
                <span>Open</span>
                <span style={{ fontSize: 10 }}>→</span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <SectionLabel>How It Works</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative">
          {/* connecting line — desktop only */}
          <div className="hidden sm:block absolute top-10 left-[33%] right-[33%] h-px"
            style={{ background: `linear-gradient(90deg, ${PRIMARY}44, ${SUCCESS}44)` }} />
          {[
            { step: "01", icon: "🚗", title: "Add Your Vehicle", desc: "Enter your car model, mileage, fuel type and basic service history.", color: PRIMARY },
            { step: "02", icon: "🤖", title: "Run AI Scan",      desc: "Our XGBoost models analyze 8 components and predict maintenance windows.", color: WARNING },
            { step: "03", icon: "📋", title: "Get Service Plan", desc: "Receive a prioritized action list with cost estimates and nearby centers.", color: SUCCESS },
          ].map(({ step, icon, title, desc, color }, i) => (
            <motion.div key={step}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
              className="rounded-2xl p-6 text-center flex flex-col items-center gap-3"
              style={{ background: CARD, border: `1px solid ${color}30` }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl relative"
                style={{ background: `${color}15`, border: `1px solid ${color}40` }}>
                {icon}
                <span className="absolute -top-2 -right-2 text-xs font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: color, color: BG }}>{step}</span>
              </div>
              <p className="font-bold text-sm" style={{ color: TEXT }}>{title}</p>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HEALTH ANALYTICS ──────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <SectionLabel>Health Analytics</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div whileHover={{ y: -3, boxShadow: `0 8px 28px ${SUCCESS}18` }}
            className="rounded-2xl p-5 transition-all" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: TEXT }}>Health Trend</p>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${SUCCESS}15`, color: SUCCESS }}>↑ Improving</span>
            </div>
            <LineChart data={report ? HEALTH_TREND.map((_, i) => Math.min(100, healthScore - (HEALTH_TREND.length - 1 - i) * 2.5)) : HEALTH_TREND} color={SUCCESS} />
            <div className="flex justify-between text-xs mt-2" style={{ color: MUTED }}>
              {["W1","W2","W3","W4","W5","W6","W7"].map(w => <span key={w}>{w}</span>)}
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -3, boxShadow: `0 8px 28px ${PRIMARY}18` }}
            className="rounded-2xl p-5 transition-all" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: TEXT }}>Service Cost (₹)</p>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${PRIMARY}15`, color: PRIMARY }}>Last 6 months</span>
            </div>
            <BarChart data={COST_TREND} labels={MONTHS} color={PRIMARY} />
            <p className="text-xs mt-2 text-right font-semibold" style={{ color: PRIMARY }}>
              Total ₹{COST_TREND.reduce((a, b) => a + b, 0).toLocaleString()}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── MAINTENANCE CHECKLIST ─────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-10">
        <SectionLabel>Maintenance Checklist</SectionLabel>
        <div className="rounded-2xl p-6" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {/* Progress header */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: TEXT }}>
              {checklist.filter(c => c.done).length} of {checklist.length} completed
            </p>
            <span className="text-xs font-bold px-2 py-1 rounded-full"
              style={{
                background: checklist.length > 0 && checklist.filter(c=>c.done).length === checklist.length ? `${SUCCESS}20` : `${PRIMARY}18`,
                color: checklist.length > 0 && checklist.filter(c=>c.done).length === checklist.length ? SUCCESS : PRIMARY,
              }}>
              {checklist.length > 0 ? Math.round((checklist.filter(c=>c.done).length/checklist.length)*100) : 0}%
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 rounded-full mb-5 overflow-hidden" style={{ background: SURFACE }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: checklist.length > 0 ? `${(checklist.filter(c=>c.done).length/checklist.length)*100}%` : "0%" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${SUCCESS})` }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {checklist.map((item, i) => (
              <motion.div key={i} layout
                whileHover={{ scale: 1.01 }}
                className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group"
                style={{ background: item.done ? `${SUCCESS}10` : SURFACE, border: `1px solid ${item.done ? SUCCESS + "44" : BORDER}` }}
                onClick={() => setChecklist(p => p.map((x, j) => j === i ? { ...x, done: !x.done } : x))}
              >
                <motion.div animate={{ scale: item.done ? [1.3, 1] : 1 }}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: item.done ? SUCCESS : "transparent", border: `2px solid ${item.done ? SUCCESS : MUTED}` }}>
                  {item.done && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                </motion.div>
                <span className="text-sm flex-1" style={{ color: item.done ? MUTED : TEXT, textDecoration: item.done ? "line-through" : "none" }}>
                  {item.label}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); setChecklist(p => p.filter((_, j) => j !== i)); }}
                  className="text-xs w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: MUTED }}
                  onMouseEnter={e => e.currentTarget.style.color = DANGER}
                  onMouseLeave={e => e.currentTarget.style.color = MUTED}
                  title="Remove"
                >✕</button>
              </motion.div>
            ))}
          </div>

          {/* Add new item */}
          <div className="flex gap-2 pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
            <input
              className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }}
              placeholder="Add checklist item..."
              value={newItem}
              onChange={e => setNewItem(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addChecklistItem()}
              onFocus={e => (e.target.style.borderColor = PRIMARY)}
              onBlur={e  => (e.target.style.borderColor = BORDER)}
            />
            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
              onClick={addChecklistItem}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0"
              style={{ background: newItem.trim() ? PRIMARY : SURFACE, color: newItem.trim() ? BG : MUTED, border: `1px solid ${newItem.trim() ? PRIMARY : BORDER}`, transition: "all 0.2s" }}
            >+ Add</motion.button>
          </div>
        </div>
      </section>

      {/* ── NEARBY SERVICE CENTERS ────────────────────────────────────────── */}
      <section id="centers" className="max-w-5xl mx-auto px-6 pb-12">
        <SectionLabel>Nearby Service Centers</SectionLabel>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}></p>
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
