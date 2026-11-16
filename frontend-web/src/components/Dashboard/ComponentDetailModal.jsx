import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { T } from "./dashboardUtils";
import { DashboardIcon } from "./DiagnosticCards";

export default function ComponentDetailModal({ detail, onClose, onReport, onAnalyze }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!detail) return null;

  const health = detail.health != null ? Math.max(0, Math.min(100, Math.round(detail.health))) : null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="Close component details"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border bg-white"
        style={{ borderColor: T.border, boxShadow: T.shadow }}>
        <div className="flex items-start justify-between border-b px-5 py-4" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: detail.soft, color: detail.color, border: `1px solid ${detail.color}30` }}>
              <DashboardIcon name={detail.icon} size={22} color={detail.color} />
            </span>
            <div>
              <p className="text-base font-extrabold" style={{ color: T.text }}>{detail.title}</p>
              <p className="text-[11px]" style={{ color: T.muted }}>{detail.subtitle}</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
            style={{ background: detail.soft, border: `1px solid ${detail.color}26` }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: detail.color }}>
                Current status
              </p>
              <p className="mt-0.5 text-sm font-black" style={{ color: T.text }}>{detail.status}</p>
            </div>
            {health != null && (
              <div className="text-right">
                <p className="text-2xl font-black leading-none" style={{ color: detail.color }}>{health}%</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: T.faint }}>Health</p>
              </div>
            )}
          </div>

          {health != null && (
            <div className="h-2 overflow-hidden rounded-full" style={{ background: T.surface }}>
              <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${health}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }} style={{ background: detail.color }} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(detail.rows || []).map((row) => (
              <div key={row.label} className="rounded-xl border px-3.5 py-3"
                style={{ borderColor: T.border, background: T.surface }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: T.faint }}>{row.label}</p>
                <p className="mt-1 text-xs font-black" style={{ color: T.text }}>{row.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border px-4 py-3" style={{ borderColor: T.border }}>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: T.faint }}>Aura insight</p>
            <p className="mt-1.5 text-xs leading-5" style={{ color: T.muted }}>{detail.note}</p>
          </div>

          {detail.cost && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: T.blueSoft, border: "1px solid #BFDBFE" }}>
              <span className="text-[11px] font-bold" style={{ color: T.blue }}>Estimated service cost</span>
              <span className="text-xs font-black" style={{ color: T.text }}>{detail.cost}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t px-5 py-4" style={{ borderColor: T.border }}>
          <button type="button" onClick={onAnalyze}
            className="flex-1 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.cyan})` }}>
            Run AI analysis
          </button>
          <button type="button" onClick={onReport}
            className="rounded-xl border px-4 py-2.5 text-xs font-bold"
            style={{ borderColor: T.border, color: T.text, background: T.card }}>
            Open full report
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
