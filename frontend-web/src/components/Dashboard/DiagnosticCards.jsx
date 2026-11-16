import React from "react";
import { motion } from "framer-motion";
import {
  T,
  URGENCY,
  componentFor,
  buildSensorStatuses,
  urgencyStyle,
  voltageUrgency,
  formatNumber,
  measuredValue,
} from "./dashboardUtils";
import { isElectricVehicle } from "../../data/vehicleCatalog";

const ICON_PATHS = {
  pressure: <><circle cx="12" cy="12" r="7" /><path d="M12 12v-4M12 12l3 2" /></>,
  camera: <><rect x="3" y="7" width="14" height="10" rx="2" /><circle cx="10" cy="12" r="2.4" /><path d="m17 10 3-2v8l-3-2" /></>,
  climate: <><path d="M12 3v18M4 7l16 10M20 7 4 17M12 6l2.5-2.5M12 6 9.5 3.5M12 18l2.5 2.5M12 18l-2.5 2.5" /></>,
  navigation: <><path d="m12 3 7 18-7-4-7 4 7-18Z" /><path d="M12 3v14" /></>,
  radar: <><path d="M12 21a9 9 0 1 0-9-9" /><path d="M12 17a5 5 0 1 0-5-5" /><path d="M12 17 3 8" /></>,
  battery: <><rect x="3" y="8" width="15" height="9" rx="2" /><path d="M18 11h3v3h-3M7 5v3M14 5v3" /></>,
  voltage: <><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" /></>,
  motor: <><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
  mileage: <><path d="M12 21a9 9 0 1 0-9-9" /><path d="M12 12v-3M12 12l4 3" /><path d="M3 12h2M19 12h2" /></>,
  speed: <><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 18 5-6" /><circle cx="12" cy="18" r="1.4" /></>,
  fuel: <><path d="M5 21V4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v17" /><path d="M5 12h9M14 6h2l3 3v8a2 2 0 0 1-4 0v-5" /><path d="M3 21h12" /></>,
  spark: <><path d="m12 3 2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2L12 3Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  alert: <><path d="M12 3 2 21h20L12 3Z" /><path d="M12 9v5M12 17.5v.5" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="3" />,
  range: <><path d="M5 18a8 8 0 1 1 15 0" /><path d="m12 18 4-7" /><path d="M4 21h16" /></>,
  awd: <><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /><path d="M7 14V8h10v6M7 11h10" /></>,
};

function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name] || ICON_PATHS.spark}
    </svg>
  );
}

export function StatusStrip({ report, vehicle, analyzing, onAnalyze, onStop, onShowReport }) {
  const score = report?.overall_health_score == null ? null : Math.round(report.overall_health_score);
  const electric = isElectricVehicle(vehicle);
  const unitName = electric ? "MOTOR" : "ENGINE";
  const engine = componentFor(report, electric ? "motor" : "engine", electric ? "battery" : "engine_oil");
  const battery = componentFor(report, "battery");
  const brakes = componentFor(report, "brakes");
  const doneCount = report?.components?.filter((component) => component.urgency === "good").length || 0;

  const headline = !report
    ? "AWAITING ANALYSIS"
    : !engine
      ? "NOT ASSESSED"
      : engine.urgency === "critical"
      ? `${unitName} ATTENTION`
      : engine?.urgency === "warning"
        ? `${unitName} IN PROGRESS`
        : `${unitName} SCREENED`;

  const chip = (label, urgency, value) => {
    const style = urgencyStyle(urgency);
    return (
      <span key={label} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em]"
        style={{ background: urgency ? style.soft : T.surface, borderColor: urgency ? `${style.color}30` : T.border, color: urgency ? style.color : T.faint }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: urgency ? style.color : T.faint }} />
        {label}
        {value != null && <span className="text-[11px] font-black" style={{ color: T.text }}>{value}</span>}
      </span>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white p-5 sm:p-6"
      style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0) 70%)" }} />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-end gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: T.faint }}>
              Diagnostic progress
            </p>
            <div className="mt-1 flex items-end gap-3">
              <span className="text-5xl font-black leading-none tracking-tighter" style={{ color: T.text }}>
                {score != null ? `${score}%` : "--"}
              </span>
              <span className="pb-1.5 text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: T.blue }}>
                {headline}
              </span>
            </div>
          </div>
          <div className="mb-1 hidden h-12 w-px sm:block" style={{ background: T.border }} />
          <div className="mb-1 hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.faint }}>Systems</p>
            <p className="mt-1 text-xs font-bold" style={{ color: T.text }}>
              {!report
                ? "Waiting for assessment"
                : report.components.length
                  ? `${doneCount} rule checks clear · ${report.components.length - doneCount} need review`
                  : "No supported readings assessed"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {chip("Done", "good", doneCount)}
          {chip("Battery", battery?.urgency || null, battery ? URGENCY[battery.urgency]?.short : "No data")}
          {chip("Brakes", brakes?.urgency || null, brakes ? URGENCY[brakes.urgency]?.short : "No data")}
          <button type="button" onClick={onShowReport}
            className="rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-colors hover:bg-slate-50"
            style={{ borderColor: T.border, color: T.text, background: T.card }}>
            AI Report
          </button>
          <button type="button" onClick={onAnalyze} disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-70"
            style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.cyan})`, boxShadow: "0 10px 22px rgba(37,99,235,0.28)" }}>
            <Icon name="spark" size={14} color="#fff" />
            {analyzing ? "Checking" : "Run assessment"}
          </button>
          {analyzing && (
            <button type="button" onClick={onStop}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.12em]"
              style={{ borderColor: T.border, color: T.muted, background: T.card }}>
              <Icon name="stop" size={13} color={T.muted} />
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-5 h-2.5 overflow-hidden rounded-full" style={{ background: T.surface }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score ?? 0}%`, background: `linear-gradient(90deg, ${T.blue} 0%, ${T.cyan} 65%, #67E8F9 100%)` }} />
        <div className="absolute inset-0 flex justify-between px-[1%]">
          {Array.from({ length: 20 }).map((_, index) => (
            <span key={index} className="h-full w-px" style={{ background: "#FFFFFF99", opacity: 0.45 }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AIAssistantCard({ user, report, analyzing, onAnalyze, onStop }) {
  const firstName = user?.name?.trim()?.split(" ")[0] || "there";
  const critical = report?.components?.filter((component) => component.urgency === "critical") || [];
  const warning = report?.components?.filter((component) => component.urgency === "warning") || [];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-5 sm:p-6"
      style={{ borderColor: T.border, boxShadow: T.shadow }}>
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.16) 0%, rgba(37,99,235,0) 70%)" }} />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, rgba(14,165,233,0) 70%)" }} />

      <div className="relative flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl text-white"
          style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.cyan})`, boxShadow: "0 12px 26px rgba(37,99,235,0.30)" }}>
          <Icon name="spark" size={22} color="#fff" strokeWidth={2} />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white" style={{ background: T.success }} />
        </div>
        <div>
          <p className="text-sm font-extrabold" style={{ color: T.text }}>Assessment guide</p>
          <p className="text-[11px] font-medium" style={{ color: analyzing ? T.blue : T.success }}>
            {analyzing ? "Checking supplied data..." : report ? "Assessment returned" : "Ready to check supplied data"}
          </p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]"
          style={{ background: T.blueSoft, color: T.blue }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: T.blue }} />
          Rules
        </span>
      </div>

      <div className="relative mt-5 flex-1">
        <p className="text-base font-extrabold" style={{ color: T.text }}>
          Hi {firstName}! I can explain your vehicle assessment.
        </p>
        <p className="mt-2 text-sm leading-6" style={{ color: T.muted }}>
          I can explain supplied readings and screening rules. No result is a substitute for a technician's inspection.
        </p>

        {report?.top_alert && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3"
            style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
            <Icon name="alert" size={16} color={T.danger} />
            <p className="text-xs font-medium leading-5" style={{ color: "#991B1B" }}>{report.top_alert}</p>
          </div>
        )}

        {report && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { label: "Critical", value: critical.length, color: T.danger },
              { label: "Monitor", value: warning.length, color: T.warning },
              { label: "Healthy", value: report.components.filter((component) => component.urgency === "good").length, color: T.success },
            ].map((item) => (
              <div key={item.label} className="rounded-xl px-2 py-2.5 text-center" style={{ background: T.surface }}>
                <p className="text-lg font-black" style={{ color: item.color }}>{item.value}</p>
                <p className="text-[10px] font-semibold" style={{ color: T.muted }}>{item.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-xl border p-3" style={{ borderColor: T.border, background: T.surface }}>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: T.blueSoft, color: T.blue }}>
              <Icon name="check" size={14} color={T.blue} />
            </span>
            <div>
              <p className="text-[11px] font-bold" style={{ color: T.text }}>Assessment source</p>
              <p className="text-[10px]" style={{ color: T.faint }}>{report?.assessment_method === "threshold_rules" ? "Documented threshold rules" : "No assessment available"}</p>
            </div>
            <span className="ml-auto text-[10px] font-bold" style={{ color: T.muted }}>
              {report?.model_status === "available" ? "Model loaded" : "No trained model"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-5">
        {analyzing ? (
          <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
            style={{ borderColor: "#BFDBFE", background: "#EFF6FF" }}>
            <span className="flex items-center gap-1">
              {[0, 1, 2].map((n) => (
                <motion.span key={n} className="h-1.5 w-1.5 rounded-full"
                  style={{ background: T.blue }}
                  animate={{ opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1, repeat: Infinity, delay: n * 0.18 }} />
              ))}
            </span>
            <p className="flex-1 text-xs font-bold" style={{ color: T.blue }}>Thinking…</p>
            <button type="button" onClick={onStop}
              className="rounded-lg border bg-white px-2.5 py-1.5 text-[10px] font-bold"
              style={{ borderColor: "#BFDBFE", color: T.blue }}>
              Stop
            </button>
          </div>
        ) : (
          <button type="button" onClick={onAnalyze}
            className="w-full rounded-xl px-4 py-3 text-xs font-bold text-white transition-transform hover:-translate-y-0.5"
            style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.cyan})`, boxShadow: "0 10px 24px rgba(37,99,235,0.22)" }}>
            {report ? "Re-run AI analysis" : "Run AI analysis"}
          </button>
        )}
      </div>
    </div>
  );
}

function ModuleVisual({ name, color }) {
  const common = { fill: "none", stroke: color, strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

  if (name === "pressure") {
    return (
      <svg viewBox="0 0 64 64" className="h-12 w-12">
        <circle cx="32" cy="32" r="17" {...common} strokeWidth="4" opacity="0.35" />
        <circle cx="32" cy="32" r="10" {...common} strokeWidth="4" />
        <path d="M32 22v10l6 4" {...common} />
        <path d="M10 32h6M48 32h6M32 10v6M32 48v6" {...common} opacity="0.7" />
        <circle cx="32" cy="32" r="2.4" fill={color} />
      </svg>
    );
  }

  if (name === "camera") {
    return (
      <svg viewBox="0 0 64 64" className="h-12 w-12">
        <rect x="13" y="20" width="38" height="26" rx="6" {...common} />
        <circle cx="32" cy="33" r="9" {...common} strokeWidth="2.6" />
        <circle cx="32" cy="33" r="4" {...common} />
        <path d="m46 25 6-4v16l-6-4M20 20l3-5h18l3 5" {...common} />
        <circle cx="44" cy="25" r="1.4" fill={color} />
      </svg>
    );
  }

  if (name === "climate") {
    return (
      <svg viewBox="0 0 64 64" className="h-12 w-12">
        <path d="M25 38V17a7 7 0 0 1 14 0v21a12 12 0 1 1-14 0Z" {...common} />
        <circle cx="32" cy="46" r="6" fill={`${color}22`} stroke={color} strokeWidth="1.7" />
        <path d="M32 43v-18" {...common} strokeWidth="3" />
        <path d="M13 17h7M13 25h5M48 17h4M48 25h6M15 50h5M46 50h5" {...common} opacity="0.7" />
      </svg>
    );
  }

  if (name === "navigation") {
    return (
      <svg viewBox="0 0 64 64" className="h-12 w-12">
        <path d="m32 9 17 42-17-10-17 10Z" {...common} strokeWidth="2.2" />
        <path d="M32 9v32" {...common} />
        <circle cx="32" cy="30" r="3" fill={color} />
        <path d="M13 48c8 5 30 5 38 0" {...common} opacity="0.55" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12">
      <circle cx="32" cy="32" r="20" {...common} opacity="0.25" />
      <circle cx="32" cy="32" r="13" {...common} opacity="0.55" />
      <circle cx="32" cy="32" r="5" {...common} />
      <path d="M32 12v10M32 42v10M12 32h10M42 32h10" {...common} opacity="0.6" />
      <path d="M32 32 51 21" {...common} strokeWidth="2.4" />
      <circle cx="51" cy="21" r="2.4" fill={color} />
    </svg>
  );
}

export function ElectronicsCard({ report, vehicle, onSelect, className = "" }) {
  const items = buildSensorStatuses(report, vehicle);

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white p-5 sm:p-6 ${className}`}
      style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: T.faint }}>Vehicle systems</p>
          <h2 className="mt-1 text-xl font-black tracking-tight" style={{ color: T.text }}>CAR ELECTRONICS</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border px-2.5 py-1 text-[10px] font-bold" style={{ borderColor: T.border, color: T.muted }}>
            5 modules
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{ background: T.surface, color: T.muted }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: T.muted }} />
            {report ? "Rule screen" : "No readings"}
          </span>
        </div>
      </div>

      <div className="relative mt-6">
        <div className="pointer-events-none absolute left-[8%] right-[8%] top-[46px] hidden h-px xl:block"
          style={{ background: `linear-gradient(90deg, ${T.border}, ${T.blue}55, ${T.border})` }} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item) => {
            const style = item.urgency ? urgencyStyle(item.urgency) : { color: T.faint, soft: T.surface };
            const status = !item.urgency
              ? "No data"
              : item.urgency === "good"
                ? "Good"
                : item.urgency === "warning"
                  ? "Create report"
                  : "Action needed";

            return (
              <button key={item.key} type="button"
                onClick={() => onSelect?.(item.key)}
                className="group relative rounded-2xl border bg-white p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg"
                style={{ borderColor: T.border }}>
                <div className="relative mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-2xl"
                  style={{ background: `linear-gradient(145deg, #FFFFFF, ${style.soft})`, border: `1px solid ${style.color}2E`, boxShadow: `0 10px 22px ${style.color}18` }}>
                  <span className="absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ boxShadow: `inset 0 0 18px ${style.color}22` }} />
                  <ModuleVisual name={item.key} color={style.color} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: T.faint }}>{item.label}</p>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color, boxShadow: `0 0 0 3px ${style.soft}` }} />
                </div>
                <p className="mt-1 text-lg font-black tracking-tight" style={{ color: T.text }}>{item.value}</p>
                <p className="text-[10px] font-bold" style={{ color: style.color }}>{status}</p>
                {item.tyres ? (
                  <div className="mt-1.5 grid grid-cols-2 gap-1">
                    {item.tyres.map((tyre, tyreIndex) => (
                      <span key={tyre.position} className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: T.surface, color: T.muted }}>
                        {["FL", "FR", "RL", "RR"][tyreIndex]} {tyre.psi}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 truncate text-[10px] font-medium" style={{ color: T.faint }}>{item.detail}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BatteryPack({ percent, color }) {
  const hasAssessment = percent != null;
  const safe = hasAssessment ? Math.max(0, Math.min(100, percent)) : 0;
  return (
    <div className="relative mx-auto w-full max-w-[290px]">
      <svg viewBox="0 0 280 168" className="w-full">
        <defs>
          <linearGradient id="batteryTop" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#DBEAFE" />
          </linearGradient>
          <linearGradient id="batteryFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EFF6FF" />
            <stop offset="100%" stopColor="#BFDBFE" />
          </linearGradient>
          <linearGradient id="batterySide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="batteryCell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
          <radialGradient id="batteryGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="140" cy="146" rx="98" ry="16" fill="#0F172A" opacity="0.10" />
        <circle cx="140" cy="76" r="72" fill="url(#batteryGlow)" />
        <polygon points="44,58 132,28 238,56 148,90" fill="url(#batteryTop)" stroke="#93C5FD" strokeWidth="1.2" />
        <polygon points="44,58 148,90 148,136 44,106" fill="url(#batteryFront)" stroke="#93C5FD" strokeWidth="1.2" />
        <polygon points="148,90 238,56 238,102 148,136" fill="url(#batterySide)" stroke="#60A5FA" strokeWidth="1.2" />
        <polygon points="56,66 132,41 218,63 142,87" fill="#FFFFFF" opacity="0.5" />
        {[0, 1, 2].map((row) => (
          <g key={row} opacity="0.82">
            <rect x={64 + row * 4} y={78 + row * 0} width="62" height="10" rx="3"
              fill="url(#batteryCell)" transform={`translate(${row * 2} ${row * 17})`} />
            <rect x={64 + row * 2} y={78 + row * 17} width="62" height="10" rx="3" fill="url(#batteryCell)" opacity="0.9" />
            <path d={`M${66 + row * 2} ${80 + row * 17} H${124 + row * 2}`} stroke="#FFFFFF" strokeWidth="1.4" opacity="0.55" />
          </g>
        ))}
        {[0, 1, 2, 3].map((cell) => (
          <rect key={cell} x={160 + cell * 15} y={78 + cell * 3} width="10" height="32" rx="3"
            fill="url(#batteryCell)" opacity="0.9" transform={`translate(${-cell * 1} ${-cell * 7})`} />
        ))}
        <path d="M154 101 H232" stroke="#EFF6FF" strokeWidth="1.4" opacity="0.5" />
        <rect x="54" y="110" width="52" height="7" rx="3.5" fill="#1E293B" opacity="0.72" />
        <rect x="58" y="112" width={44 * (safe / 100)} height="3" rx="1.5" fill="#A7F3D0" />
        <path d="M235 101 h10 v12 h-10" fill="none" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
        <circle cx="221" cy="70" r="4" fill="#DBEAFE" opacity="0.9" />
        <circle cx="228" cy="67" r="2.5" fill="#FFFFFF" opacity="0.8" />
      </svg>
      <div className="absolute left-1/2 top-[36%] -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-white/85 px-4 py-2 text-center backdrop-blur"
        style={{ borderColor: "#BFDBFE", boxShadow: "0 12px 26px rgba(37,99,235,0.16)" }}>
        <p className="text-3xl font-black leading-none tracking-tight" style={{ color: T.text }}>{hasAssessment ? `${safe}%` : "--"}</p>
        <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: color }}>{hasAssessment ? "Rule-based health" : "Not assessed"}</p>
      </div>
    </div>
  );
}

export function BatteryCard({ report, vehicle, onSelect, className = "" }) {
  const electric = isElectricVehicle(vehicle);
  const battery = componentFor(report, "battery");
  const percent = battery?.health_score ?? null;
  const style = urgencyStyle(battery?.urgency);
  const condition = battery ? URGENCY[battery.urgency]?.label : "Not assessed";
  const packVoltage = measuredValue(vehicle, "pack_voltage");
  const batteryVoltage = measuredValue(vehicle, "battery_voltage");
  const batteryAge = measuredValue(vehicle, "battery_age_months");
  const range = measuredValue(vehicle, "range_km");
  const connectivity = measuredValue(vehicle, "connectivity");
  const stats = electric
    ? [
        { label: "Pack", value: packVoltage != null ? `${packVoltage} V` : "--" },
        { label: "Range", value: range != null ? `${formatNumber(range)} km` : "--" },
        { label: "Signal", value: connectivity || "--" },
      ]
    : [
        { label: "12V", value: batteryVoltage != null ? `${Number(batteryVoltage).toFixed(1)} V` : "--" },
        { label: "Age", value: batteryAge != null ? `${batteryAge} mo` : "--" },
        { label: "Signal", value: connectivity || "--" },
      ];

  return (
    <motion.button type="button" onClick={onSelect}
      whileHover={{ y: -2 }}
      className={`flex flex-col rounded-2xl border bg-white p-5 text-left sm:p-6 ${className}`}
      style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: T.faint }}>
            {electric ? "Energy state" : "Electrical system"}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight" style={{ color: T.text }}>BATTERY</h2>
        </div>
        <span className="rounded-full border px-2.5 py-1 text-[10px] font-bold"
          style={{ borderColor: `${style.color}30`, background: style.soft, color: style.color }}>
          {battery ? condition : "Awaiting data"}
        </span>
      </div>

      <div className="mt-2 flex-1">
        <BatteryPack percent={percent} color={style.color} />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5" style={{ background: T.surface }}>
        <span className="text-[11px] font-semibold" style={{ color: T.muted }}>
          {electric ? "State of health" : "Condition"}
        </span>
        <span className="text-xs font-black" style={{ color: style.color }}>{condition}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x rounded-xl border py-2.5" style={{ borderColor: T.border }}>
        {stats.map((stat) => (
          <div key={stat.label} className="px-2 text-center" style={{ borderColor: T.border }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: T.faint }}>{stat.label}</p>
            <p className="mt-0.5 text-xs font-black" style={{ color: T.text }}>{stat.value}</p>
          </div>
        ))}
      </div>
    </motion.button>
  );
}

function VoltageGauge({ value, unit, min, max, color }) {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const cx = 130;
  const cy = 126;
  const radius = 94;
  const startAngle = 180;
  const angle = startAngle + ratio * 180;
  const radians = (angle * Math.PI) / 180;
  const needleX = cx + Math.cos(radians) * 72;
  const needleY = cy + Math.sin(radians) * 72;
  const arcLength = Math.PI * radius;

  const ticks = Array.from({ length: 21 }).map((_, index) => {
    const tickAngle = (180 + index * 9) * Math.PI / 180;
    const outer = radius + 2;
    const inner = index % 5 === 0 ? radius - 12 : radius - 6;
    return {
      x1: cx + Math.cos(tickAngle) * inner,
      y1: cy + Math.sin(tickAngle) * inner,
      x2: cx + Math.cos(tickAngle) * outer,
      y2: cy + Math.sin(tickAngle) * outer,
      major: index % 5 === 0,
    };
  });

  return (
    <svg viewBox="0 0 260 152" className="w-full">
      <defs>
        <linearGradient id="voltageArc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={T.blue} />
          <stop offset="100%" stopColor={T.cyan} />
        </linearGradient>
        <radialGradient id="voltageGlow" cx="0.5" cy="0.6" r="0.6">
          <stop offset="0%" stopColor={color} stopOpacity="0.20" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r="78" fill="url(#voltageGlow)" />
      <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none" stroke="#E8EEF6" strokeWidth="12" strokeLinecap="round" />
      <path d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
        fill="none" stroke="url(#voltageArc)" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={`${arcLength * ratio} ${arcLength}`}
        style={{ transition: "stroke-dasharray 0.9s ease" }} />
      {ticks.map((tick, index) => (
        <line key={index} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2}
          stroke={tick.major ? T.text : T.faint} strokeWidth={tick.major ? 1.6 : 1}
          opacity={tick.major ? 0.55 : 0.35} />
      ))}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
        stroke={color} strokeWidth="3.2" strokeLinecap="round"
        style={{ transition: "all 0.8s ease" }} />
      <circle cx={cx} cy={cy} r="7" fill="#FFFFFF" stroke={color} strokeWidth="3" />
      <circle cx={cx} cy={cy} r="2.4" fill={color} />
      <text x="26" y="143" textAnchor="middle" fontSize="9" fontWeight="700" fill={T.faint}>{min}</text>
      <text x="234" y="143" textAnchor="middle" fontSize="9" fontWeight="700" fill={T.faint}>{max}</text>
      <text x={cx} y="93" textAnchor="middle" fontSize="28" fontWeight="900" fill={T.text}>
        {Number(value).toFixed(value >= 100 ? 0 : 1)}
      </text>
      <text x={cx} y="108" textAnchor="middle" fontSize="9" fontWeight="800" fill={T.faint} letterSpacing="2">{unit}</text>
    </svg>
  );
}

export function VoltageCard({ report, vehicle, onSelect, className = "" }) {
  const electric = isElectricVehicle(vehicle);
  const packVoltage = measuredValue(vehicle, "pack_voltage");
  const batteryVoltage = measuredValue(vehicle, "battery_voltage");
  const isPack = electric || packVoltage != null;
  const rawVoltage = isPack ? packVoltage : batteryVoltage;
  const volts = rawVoltage == null ? null : Number(rawVoltage);
  const urgency = voltageUrgency(vehicle);
  const style = urgencyStyle(urgency);
  const color = isPack && volts != null ? T.blue : style.color;
  const min = isPack ? 200 : 10;
  const max = isPack ? 450 : 15;
  const status = volts == null ? "Not assessed" : isPack ? "Pack voltage supplied" : `${style.label} voltage screen`;

  return (
    <motion.button type="button" onClick={onSelect}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border bg-white p-5 text-left sm:p-6 ${className}`}
      style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: T.faint }}>Electrical</p>
          <h2 className="mt-1 text-xl font-black tracking-tight" style={{ color: T.text }}>VOLTAGE</h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: T.blueSoft, color: T.blue }}>
          <Icon name="voltage" size={18} color={T.blue} />
        </span>
      </div>

      <div className="mt-2">
        {volts == null ? (
          <div className="flex h-[152px] items-center justify-center text-sm font-semibold" style={{ color: T.faint }}>
            No voltage reading supplied
          </div>
        ) : (
          <VoltageGauge value={volts} unit={isPack ? "PACK VOLTS" : "VOLTS"} min={min} max={max} color={color} />
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: T.surface }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: T.faint }}>{status}</p>
          <p className="text-[10px]" style={{ color: T.muted }}>
            {isPack && batteryVoltage != null
              ? `12V reading ${Number(batteryVoltage).toFixed(1)} V`
              : report?.model_status === "not_trained"
                ? "No trained ML model is installed"
                : "Voltage screening is not a battery health test"}
          </p>
        </div>
        <span className="text-xs font-black" style={{ color }}>{urgency || (volts != null ? "supplied" : T.muted)}</span>
      </div>
    </motion.button>
  );
}

function MotorCurve({ rpm, color }) {
  const points = [38, 30, 24, 26, 21, 15, 18, 12, 16, 10, 13, 8];
  const width = 230;
  const height = 84;
  const maxRpm = 8000;
  const activeRatio = Math.max(0.2, Math.min(1, rpm / maxRpm));
  const pointCount = Math.max(3, Math.round(points.length * activeRatio));
  const selected = points.slice(0, pointCount);
  const coords = selected.map((value, index) => ({
    x: 8 + (index / Math.max(1, selected.length - 1)) * (width - 16),
    y: 10 + (value / 40) * (height - 20),
  }));
  const line = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;
  const last = coords[coords.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="motorCurveArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[22, 44, 66].map((y) => (
        <line key={y} x1="8" y1={y} x2={width - 8} y2={y} stroke="#E8EEF6" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#motorCurveArea)" />
      <motion.path d={line} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, ease: "easeOut" }} />
      <circle cx={last.x} cy={last.y} r="5" fill="#FFFFFF" stroke={color} strokeWidth="2.4" />
      <circle cx={last.x} cy={last.y} r="1.8" fill={color} />
    </svg>
  );
}

export function MotorCard({ report, vehicle, onSelect, className = "" }) {
  const electric = isElectricVehicle(vehicle);
  const unit = componentFor(report, electric ? "motor" : "engine");
  const style = urgencyStyle(unit?.urgency);
  const rpmValue = measuredValue(vehicle, "motor_rpm");
  const rpm = rpmValue == null ? null : Number(rpmValue);
  const health = unit?.health_score;
  const status = unit ? URGENCY[unit.urgency]?.label : "Not assessed";
  const title = electric ? "MOTOR" : "ENGINE";
  const subtitle = electric ? "Drive unit" : "Power unit";

  return (
    <motion.button type="button" onClick={onSelect}
      whileHover={{ y: -2 }}
      className={`rounded-2xl border bg-white p-5 text-left sm:p-6 ${className}`}
      style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: T.faint }}>{subtitle}</p>
          <h2 className="mt-1 text-xl font-black tracking-tight" style={{ color: T.text }}>{title}</h2>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: style.soft, color: style.color }}>
          <Icon name="motor" size={18} color={style.color} />
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: T.faint }}>RPM</p>
          <p className="text-4xl font-black leading-none tracking-tight" style={{ color: T.text }}>
            {rpm == null ? "--" : rpm.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="text-right">
          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: style.soft, color: style.color }}>
            {status}
          </span>
          <p className="mt-1 text-[10px]" style={{ color: T.faint }}>{health != null ? `${Math.round(health)}% health` : "Monitoring"}</p>
        </div>
      </div>

      <div className="mt-2">
        {rpm == null ? (
          <div className="flex h-[84px] items-center justify-center text-xs font-semibold" style={{ color: T.faint }}>
            No RPM reading supplied
          </div>
        ) : (
          <MotorCurve rpm={rpm} color={style.color} />
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="rounded-xl px-3 py-2" style={{ background: T.surface }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: T.faint }}>Avg speed</p>
          <p className="text-xs font-black" style={{ color: T.text }}>
            {measuredValue(vehicle, "avg_speed_kmh") != null ? `${Math.round(Number(vehicle.avg_speed_kmh))} km/h` : "--"}
          </p>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ background: T.surface }}>
          <p className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: T.faint }}>
            {electric ? "Range" : "Runtime"}
          </p>
          <p className="text-xs font-black" style={{ color: T.text }}>
            {electric
              ? (vehicle?.range_km != null ? `${formatNumber(vehicle.range_km)} km` : "--")
              : (measuredValue(vehicle, "engine_runtime_hours") != null ? `${Math.round(Number(vehicle.engine_runtime_hours))} hrs` : "--")}
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export function PerformanceStats({ vehicle }) {
  const electric = isElectricVehicle(vehicle);
  const measuredRange = measuredValue(vehicle, "range_km");
  const measuredAcceleration = measuredValue(vehicle, "acceleration_sec");
  const measuredDrivetrain = measuredValue(vehicle, "drivetrain");
  const range = measuredRange != null ? `${formatNumber(measuredRange)} km` : "--";
  const acceleration = measuredAcceleration != null ? `${measuredAcceleration} sec` : "--";
  const powertrain = measuredDrivetrain || (vehicle?.fuel_type
    ? `${vehicle.fuel_type.charAt(0).toUpperCase()}${vehicle.fuel_type.slice(1)}`
    : "--");

  const stats = [
    { key: "range", label: electric ? "Battery range" : "Estimated range", value: range },
    { key: "speed", label: "Acceleration", value: acceleration },
    { key: "awd", label: "Powertrain", value: powertrain },
  ];

  return (
    <div className="grid grid-cols-1 overflow-hidden rounded-2xl border bg-white sm:grid-cols-3"
      style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
      {stats.map((stat, index) => (
        <div key={stat.key}
          className={`flex items-center gap-4 px-5 py-4 sm:px-6 ${index > 0 ? "border-t sm:border-l sm:border-t-0" : ""}`}
          style={{ borderColor: T.border }}>
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: T.blueSoft, color: T.blue }}>
            <Icon name={stat.key} size={19} color={T.blue} />
          </span>
          <div className="min-w-0">
            <p className="text-xl font-black tracking-tight" style={{ color: T.text }}>{stat.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: T.faint }}>{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export { Icon as DashboardIcon };
