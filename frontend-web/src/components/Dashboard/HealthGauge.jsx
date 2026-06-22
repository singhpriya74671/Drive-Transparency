import React from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

const STATUS_COLORS = {
  critical: "#CF5C5C",
  warning:  "#D4935E",
  good:     "#4CAF7D",
};

const STATUS_LABELS = {
  critical: "Immediate Attention Required",
  warning:  "Service Recommended Soon",
  good:     "Good Condition",
};

export default function HealthGauge({ score, status }) {
  const color = STATUS_COLORS[status] || "#4CAF7D";
  const label = STATUS_LABELS[status] || "Unknown";

  return (
    <div className="flex flex-col items-center gap-3" style={{ minWidth: 180 }}>
      <div style={{ width: 160, height: 160 }}>
        <CircularProgressbar
          value={score}
          text={`${Math.round(score)}`}
          styles={buildStyles({
            pathColor:        color,
            textColor:        "#F0EBE5",
            trailColor:       "#323232",
            backgroundColor:  "#272727",
            textSize:         "22px",
            pathTransitionDuration: 1.5,
          })}
        />
      </div>
      <div
        className="px-4 py-1.5 rounded-full text-xs font-semibold text-center"
        style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}
      >
        {label}
      </div>
    </div>
  );
}
