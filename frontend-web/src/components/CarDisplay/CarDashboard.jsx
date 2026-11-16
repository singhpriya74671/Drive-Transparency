import React from "react";
import { motion } from "framer-motion";

const URGENCY_COLOR = {
  critical: "#DC2626",
  warning: "#D97706",
  good: "#16A34A",
};

const STATUS_TEXT = {
  critical: "IMMEDIATE ATTENTION REQUIRED",
  warning: "SERVICE RECOMMENDED",
  good: "VEHICLE IN GOOD CONDITION",
};

function CarModeHeader({ onExit }) {
  return (
    <header className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-xl" aria-hidden="true">🚘</span>
        <div>
          <p className="text-sm font-extrabold tracking-tight text-slate-900">Drive Transparency</p>
          <p className="text-[10px] font-medium text-slate-500">Vehicle health display</p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
          Car Mode
        </span>
      </div>
      <div className="flex items-center gap-3">
        <time className="hidden text-xs font-medium text-slate-500 sm:block">
          {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </time>
        <button
          type="button"
          onClick={onExit}
          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Back to diagnostics
        </button>
      </div>
    </header>
  );
}

function PageFooter({ status }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-3 text-[11px] text-slate-500 sm:px-6">
      <span>Drive Transparency</span>
      <span>Last updated: {new Date().toLocaleDateString("en-IN")}</span>
      {status && (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-bold uppercase tracking-wide text-slate-600">
          {status}
        </span>
      )}
    </footer>
  );
}

export default function CarDashboard({ report, onExit }) {
  if (!report) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <CarModeHeader onExit={onExit} />
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl" aria-hidden="true">🚘</span>
            <h1 className="mt-5 text-xl font-extrabold text-slate-900">No assessment to display yet</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Run a vehicle check from Diagnostics, then return to Car Mode to view its summary.
            </p>
            <button
              type="button"
              onClick={onExit}
              className="mt-6 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Open Diagnostics
            </button>
          </section>
        </main>
        <PageFooter />
      </div>
    );
  }

  const { overall_health_score, overall_status, top_alert } = report;
  const components = report.components || [];
  const alertColor = URGENCY_COLOR[overall_status] || URGENCY_COLOR.good;
  const criticalItems = components.filter((component) => component.urgency === "critical");
  const warningItems = components.filter((component) => component.urgency === "warning");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <CarModeHeader onExit={onExit} />

      <div className="flex flex-1 flex-col lg:flex-row">
        <section className="flex flex-col items-center justify-center gap-5 border-b border-slate-200 bg-white px-5 py-7 sm:px-8 lg:w-[38%] lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:px-10">
          <div className="relative h-40 w-40">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" role="img" aria-label={`Vehicle health ${Math.round(overall_health_score)} out of 100`}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={alertColor}
                strokeWidth="3"
                strokeDasharray={`${overall_health_score} ${100 - overall_health_score}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1.5s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black tracking-tight text-slate-900">{Math.round(overall_health_score)}</span>
              <span className="text-xs font-medium text-slate-500">/ 100 health</span>
            </div>
          </div>

          <motion.p
            animate={{ opacity: overall_status === "critical" ? [1, 0.65, 1] : 1 }}
            transition={{ repeat: overall_status === "critical" ? Infinity : 0, duration: 1.2 }}
            className="text-center text-sm font-extrabold tracking-wide"
            style={{ color: alertColor }}
          >
            {STATUS_TEXT[overall_status] || "ASSESSMENT READY"}
          </motion.p>

          {top_alert && (
            <div role="status" className="w-full rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-xs leading-5 text-red-700">
              {top_alert}
            </div>
          )}

          <div className="flex w-full justify-center gap-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            {[
              { label: "Critical", color: URGENCY_COLOR.critical, count: criticalItems.length },
              { label: "Warning", color: URGENCY_COLOR.warning, count: warningItems.length },
              { label: "Healthy", color: URGENCY_COLOR.good, count: components.filter((component) => component.urgency === "good").length },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="text-xl font-black" style={{ color: item.color }}>{item.count}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:overflow-y-auto lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Vehicle health overview</p>
                <h1 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900">Component health</h1>
              </div>
              <span className="text-xs text-slate-500">{components.length} assessed items</span>
            </div>

            {components.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {components.slice(0, 6).map((component) => {
                  const color = URGENCY_COLOR[component.urgency] || URGENCY_COLOR.good;
                  const healthScore = Number(component.health_score) || 0;
                  return (
                    <article key={component.component} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: color }} />
                        <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{component.label}</p>
                        <span className="text-xs font-bold" style={{ color }}>{Math.round(healthScore)}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all" style={{ width: `${healthScore}%`, background: color }} />
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                This assessment does not include component-level results.
              </p>
            )}

            {(criticalItems.length > 0 || warningItems.length > 0) && (
              <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Items needing attention">
                <h2 className="text-sm font-extrabold text-slate-900">Items needing attention</h2>
                {criticalItems.length > 0 && (
                  <p className="mt-2 text-sm leading-6 text-red-700">
                    <strong>Immediate:</strong> {criticalItems.map((component) => component.label).join(", ")}
                  </p>
                )}
                {warningItems.length > 0 && (
                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    <strong>Warning:</strong> {warningItems.map((component) => component.label).join(", ")}
                  </p>
                )}
              </section>
            )}
          </div>
        </main>
      </div>

      <PageFooter status={overall_status} />
    </div>
  );
}
