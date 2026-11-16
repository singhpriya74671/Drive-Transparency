import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { T } from "./dashboardUtils";

const STATUS_COLORS = {
  critical: T.danger,
  warning:  T.warning,
  good:     T.success,
};

const STATUS_LABELS = {
  critical: "Immediate attention",
  warning:  "Service recommended",
  good:     "Good condition",
};

export default function HealthGauge({ score, status }) {
  const color = STATUS_COLORS[status] || T.success;
  const label = STATUS_LABELS[status] || "Unknown";

  return (
    <div className="flex flex-col items-center gap-3" style={{ minWidth: 160 }}>
      <div style={{ width: 150, height: 150 }}>
        <CircularProgressbar
          value={score}
          text={`${Math.round(score)}`}
          styles={buildStyles({
            pathColor:        color,
            textColor:        T.text,
            trailColor:       T.surface,
            backgroundColor:  T.card,
            textSize:         "22px",
            pathTransitionDuration: 1.5,
          })}
        />
      </div>
      <div
        className="rounded-full px-4 py-1.5 text-center text-[11px] font-bold"
        style={{ background: `${color}12`, color, border: `1px solid ${color}33` }}
      >
        {label}
      </div>
    </div>
  );
}
