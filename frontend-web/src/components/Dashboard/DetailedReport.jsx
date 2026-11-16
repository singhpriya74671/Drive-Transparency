import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { T, URGENCY, urgencyStyle, formatDate } from "./dashboardUtils";
import HealthGauge from "./HealthGauge";
import ComponentCard from "./ComponentCard";
import VehicleIntelligence from "../VehicleIntelligence";
import NearbyServiceCenters from "../NearbyServiceCenters";

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: T.faint }}>{eyebrow}</p>
        <h2 className="mt-1 text-lg font-extrabold tracking-tight" style={{ color: T.text }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

export default function DetailedReport({ report, selectedVehicle }) {
  const navigate = useNavigate();

  if (!report) return null;

  const components = report.components || [];
  const dtcCodes = selectedVehicle?.dtc_codes
    ? selectedVehicle.dtc_codes.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const totalCostMin = components.reduce((sum, c) => sum + (c.urgency !== "good" ? c.estimated_cost_min || 0 : 0), 0);
  const totalCostMax = components.reduce((sum, c) => sum + (c.urgency !== "good" ? c.estimated_cost_max || 0 : 0), 0);

  const timelineItems = components
    .filter((c) => c.maintenance_probability != null)
    .sort((a, b) => (a.predicted_service_window_days ?? 999) - (b.predicted_service_window_days ?? 999));

  const issueItems = components
    .filter((c) => c.urgency !== "good")
    .sort((a, b) => (a.urgency === "critical" ? -1 : 1));

  const batteryVoltage = selectedVehicle?.battery_voltage != null ? Number(selectedVehicle.battery_voltage) : null;
  const engineTemp = selectedVehicle?.engine_temp_c != null ? Number(selectedVehicle.engine_temp_c) : null;
  const bvColor = batteryVoltage == null ? T.faint : batteryVoltage >= 12.4 ? T.success : batteryVoltage >= 11.8 ? T.warning : T.danger;
  const etColor = engineTemp == null ? T.faint : engineTemp <= 95 ? T.success : engineTemp <= 110 ? T.warning : T.danger;
  const bvLabel = batteryVoltage == null ? "--" : batteryVoltage >= 12.4 ? "Good" : batteryVoltage >= 11.8 ? "Low" : "Critical";
  const etLabel = engineTemp == null ? "--" : engineTemp <= 95 ? "Normal" : engineTemp <= 110 ? "Warm" : "Overheat";

  return (
    <section id="diagnostic-report" className="scroll-mt-24 space-y-5">
      <SectionTitle
        eyebrow="Full AI report"
        title="Detailed diagnostics"
        right={
          <button type="button" onClick={() => navigate("/history")}
            className="rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors hover:bg-slate-50"
            style={{ borderColor: T.border, color: T.blue, background: T.card }}>
            View service history
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-white p-5 sm:p-6 xl:col-span-7"
          style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
          <SectionTitle eyebrow="OBD-II" title="Live vehicle status" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border p-4" style={{ borderColor: T.border }}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.faint }}>OBD Status</p>
                <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "#ECFDF5", color: T.success }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: T.success }} />
                  Connected
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Battery voltage", value: batteryVoltage != null ? `${batteryVoltage.toFixed(1)} V` : "--", color: bvColor, status: bvLabel, pct: batteryVoltage == null ? 0 : ((batteryVoltage - 10) / 5) * 100 },
                  { label: "Engine temp", value: engineTemp != null ? `${engineTemp.toFixed(0)} °C` : "--", color: etColor, status: etLabel, pct: engineTemp == null ? 0 : (engineTemp / 150) * 100 },
                  { label: "Avg speed", value: selectedVehicle?.avg_speed_kmh != null ? `${Math.round(selectedVehicle.avg_speed_kmh)} km/h` : "--", color: T.blue, status: "Logged", pct: selectedVehicle?.avg_speed_kmh != null ? (selectedVehicle.avg_speed_kmh / 200) * 100 : 0 },
                ].map(({ label, value, color, status, pct }) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium" style={{ color: T.muted }}>{label}</span>
                      <span className="text-xs font-bold" style={{ color: T.text }}>{value}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full" style={{ background: T.surface }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
                    </div>
                    <p className="mt-1 text-[10px] font-semibold" style={{ color }}>{status}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border p-4" style={{ borderColor: T.border }}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.faint }}>Fault codes</p>
                {selectedVehicle?.has_dtc && dtcCodes.length > 0 ? (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#FEF2F2", color: T.danger }}>
                    {dtcCodes.length} active
                  </span>
                ) : (
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "#ECFDF5", color: T.success }}>Clear</span>
                )}
              </div>
              {selectedVehicle?.has_dtc && dtcCodes.length > 0 ? (
                <div className="space-y-2">
                  {dtcCodes.slice(0, 4).map((code, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border px-3 py-2"
                      style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
                      <div>
                        <p className="font-mono text-xs font-bold" style={{ color: T.danger }}>{code}</p>
                        <p className="text-[10px]" style={{ color: T.muted }}>Diagnostic trouble code</p>
                      </div>
                      <span className="text-[10px] font-bold" style={{ color: T.danger }}>High</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-28 flex-col items-center justify-center gap-1.5 rounded-lg" style={{ background: T.surface }}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: "#DCFCE7", color: T.success }}>✓</span>
                  <p className="text-xs font-semibold" style={{ color: T.text }}>No fault codes detected</p>
                  <p className="text-[10px]" style={{ color: T.faint }}>All monitored systems normal</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl border bg-white p-5 sm:p-6 xl:col-span-5"
          style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
          <SectionTitle eyebrow="AI health score" title="Overall vehicle health" />
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <HealthGauge score={report.overall_health_score} status={report.overall_status} />
            <div className="w-full flex-1 space-y-3">
              {report.top_alert && (
                <div className="rounded-xl border px-3.5 py-3" style={{ borderColor: "#FECACA", background: "#FEF2F2" }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: T.danger }}>Top alert</p>
                  <p className="mt-1 text-xs font-medium leading-5" style={{ color: "#991B1B" }}>{report.top_alert}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Critical", value: components.filter((c) => c.urgency === "critical").length, color: T.danger },
                  { label: "Warnings", value: components.filter((c) => c.urgency === "warning").length, color: T.warning },
                  { label: "Healthy", value: components.filter((c) => c.urgency === "good").length, color: T.success },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg px-2 py-2.5 text-center" style={{ background: T.surface }}>
                    <p className="text-xl font-black" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] font-semibold" style={{ color: T.muted }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <VehicleIntelligence report={report} selectedVehicle={selectedVehicle} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
          <SectionTitle eyebrow="Forecast" title="Maintenance timeline" />
          {timelineItems.length > 0 ? (
            <div className="relative pl-8">
              <div className="absolute bottom-2 left-3 top-2 w-px" style={{ background: T.border }} />
              <div className="relative mb-4">
                <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: T.blue }} />
                <p className="text-[11px] font-bold" style={{ color: T.blue }}>
                  Today · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              {timelineItems.map((item) => {
                const days = item.predicted_service_window_days ?? 180;
                const probability = item.maintenance_probability ?? 0;
                const color = probability >= 70 ? T.danger : probability >= 40 ? T.warning : T.success;
                const due = new Date(Date.now() + days * 86400000);
                const span = days <= 7 ? "This week" : days <= 30 ? `${days} days` : `${Math.round(days / 30)} months`;
                return (
                  <div key={item.component} className="relative mb-3">
                    <div className="absolute -left-6 top-3 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ background: color }} />
                    <div className="rounded-xl border p-3" style={{ borderColor: `${color}33`, background: `${color}0D` }}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold" style={{ color: T.text }}>{item.label || item.component}</p>
                        <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ background: `${color}20`, color }}>{span}</span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between">
                        <p className="text-[10px]" style={{ color: T.muted }}>{due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        <p className="text-[10px] font-semibold" style={{ color: T.muted }}>{probability.toFixed(0)}% risk</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl px-3 py-4 text-xs" style={{ background: T.surface, color: T.muted }}>No maintenance predictions available yet.</p>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
          <SectionTitle eyebrow="Budget" title="Estimated upcoming costs"
            right={<span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: T.surface, color: T.muted }}>Next 6 months</span>} />
          {totalCostMin > 0 ? (
            <>
              <div className="space-y-2">
                {issueItems.map((item) => {
                  const color = item.urgency === "critical" ? T.danger : T.warning;
                  return (
                    <div key={item.component} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5" style={{ background: T.surface }}>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: color }} />
                        <span className="truncate text-xs font-semibold" style={{ color: T.text }}>{item.label || item.component}</span>
                      </div>
                      <span className="flex-shrink-0 text-xs font-bold" style={{ color: T.text }}>
                        ₹{(item.estimated_cost_min || 0).toLocaleString("en-IN")} – ₹{(item.estimated_cost_max || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border px-4 py-3"
                style={{ borderColor: "#BFDBFE", background: T.blueSoft }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: T.blue }}>Total estimate</p>
                  <p className="text-[10px]" style={{ color: T.muted }}>Next 6 months</p>
                </div>
                <p className="text-lg font-black" style={{ color: T.blue }}>
                  ₹{totalCostMin.toLocaleString("en-IN")} – ₹{totalCostMax.toLocaleString("en-IN")}
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-xl px-4 py-8 text-center" style={{ background: T.surface }}>
              <p className="text-sm font-bold" style={{ color: T.success }}>No upcoming service costs</p>
              <p className="mt-1 text-xs" style={{ color: T.muted }}>All components are within healthy service windows.</p>
            </div>
          )}
        </div>
      </div>

      {issueItems.length > 0 && (
        <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
          <SectionTitle eyebrow="Action plan" title="Recommended services" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {issueItems.map((item) => {
              const style = urgencyStyle(item.urgency);
              return (
                <div key={item.component} className="flex items-start gap-3 rounded-xl border p-3.5"
                  style={{ borderColor: `${style.color}33`, background: style.soft }}>
                  <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                    style={{ background: "#fff", color: style.color }}>
                    {item.urgency === "critical" ? "!" : "•"}
                  </span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: style.color }}>{item.label || item.component}</p>
                    <p className="mt-0.5 text-xs leading-5" style={{ color: T.muted }}>{item.explanation}</p>
                    <p className="mt-1 text-[11px] font-bold" style={{ color: T.text }}>
                      ₹{(item.estimated_cost_min || 0).toLocaleString("en-IN")} – ₹{(item.estimated_cost_max || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
        <SectionTitle eyebrow="Component-level" title="Component analysis" />
        <div className="space-y-3">
          {components.map((component, index) => (
            <motion.div key={component.component}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}>
              <ComponentCard component={component} />
            </motion.div>
          ))}
        </div>
      </div>

      {issueItems.length > 0 && <NearbyServiceCenters vehicle={selectedVehicle} />}

      <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
        <p className="text-[11px]" style={{ color: T.faint }}>
          Generated: {formatDate(report.generated_at) || new Date(report.generated_at).toLocaleString("en-IN")}
        </p>
        <button type="button" onClick={() => navigate("/history")}
          className="text-[11px] font-bold underline" style={{ color: T.blue }}>
          View service history →
        </button>
      </div>
    </section>
  );
}
