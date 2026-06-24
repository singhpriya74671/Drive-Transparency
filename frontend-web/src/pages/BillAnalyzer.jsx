import React, { useState } from "react";
import { motion } from "framer-motion";

const BG = "#1C1C1C";
const CARD = "#272727";
const SURFACE = "#323232";
const PRIMARY = "#DDD0C8";
const TEXT = "#F0EBE5";
const MUTED = "#8C8480";
const BORDER = "#3D3D3D";
const SUCCESS = "#4CAF7D";
const WARNING = "#D4935E";
const DANGER = "#CF5C5C";

const CATALOG = [
  { keys: ["oil", "engine oil", "lubricant"], label: "Engine Oil Change", range: [1800, 3500] },
  { keys: ["filter", "air filter"], label: "Air Filter Replacement", range: [600, 1400] },
  { keys: ["brake", "pads", "disc"], label: "Brake Service", range: [2500, 7500] },
  { keys: ["battery"], label: "Battery Check / Replacement", range: [800, 8500] },
  { keys: ["alignment", "wheel alignment"], label: "Wheel Alignment", range: [700, 1800] },
  { keys: ["rotation", "tyre rotation", "tire rotation"], label: "Tyre Rotation", range: [400, 900] },
  { keys: ["coolant", "radiator"], label: "Coolant Flush", range: [1200, 2800] },
  { keys: ["spark", "spark plug"], label: "Spark Plug Service", range: [900, 2800] },
  { keys: ["ac", "air conditioning"], label: "AC Service", range: [1200, 4200] },
  { keys: ["diagnostic", "scan", "obd"], label: "Diagnostic Scan", range: [500, 1500] },
  { keys: ["labor", "labour"], label: "General Labor", range: [500, 2500] },
];

function parseMoney(value) {
  const match = String(value).replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

function classifyLine(line) {
  const text = line.toLowerCase();
  const detected = CATALOG.find((item) => item.keys.some((key) => text.includes(key)));
  const amount = parseMoney(line);
  if (!detected) {
    return {
      raw: line,
      label: "Unrecognized line item",
      amount,
      min: amount ? amount * 0.7 : 0,
      max: amount ? amount * 1.3 : 0,
      confidence: 0,
      flag: "review",
    };
  }

  const [min, max] = detected.range;
  const mid = (min + max) / 2;
  let flag = "normal";
  if (amount && amount > max * 1.25) flag = "high";
  else if (amount && amount < min * 0.75) flag = "low";

  return {
    raw: line,
    label: detected.label,
    amount,
    min,
    max,
    confidence: 1,
    flag,
    suggested: mid,
  };
}

function scoreFrom(items, billAmount) {
  const recognized = items.filter((item) => item.confidence > 0);
  const unknown = items.length - recognized.length;
  const estimatedMin = recognized.reduce((sum, item) => sum + item.min, 0);
  const estimatedMax = recognized.reduce((sum, item) => sum + item.max, 0);
  const estimatedFair = recognized.reduce((sum, item) => sum + ((item.min + item.max) / 2), 0);

  let score = 100;
  if (billAmount > 0 && estimatedFair > 0) {
    const delta = Math.abs(billAmount - estimatedFair) / estimatedFair;
    score -= Math.min(45, delta * 100);
  }
  score -= Math.min(20, unknown * 8);
  const capped = Math.max(0, Math.min(100, Math.round(score)));

  return {
    recognizedCount: recognized.length,
    unknownCount: unknown,
    estimatedMin,
    estimatedMax,
    estimatedFair,
    score: capped,
  };
}

export default function BillAnalyzer() {
  const [centerName, setCenterName] = useState("");
  const [vehicle, setVehicle] = useState("Hyundai i20");
  const [totalBill, setTotalBill] = useState("");
  const [billText, setBillText] = useState(
    "Engine oil change - 2800\nAir filter replacement - 900\nWheel alignment - 1200\nLabor charge - 800"
  );

  const items = billText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(classifyLine);

  const billAmount = parseMoney(totalBill);
  const summary = scoreFrom(items, billAmount);
  const transparencyState =
    summary.score >= 80 ? { label: "Fair", color: SUCCESS } :
    summary.score >= 55 ? { label: "Needs Review", color: WARNING } :
    { label: "Possible Overcharge", color: DANGER };

  const overage = summary.estimatedFair > 0 && billAmount > summary.estimatedMax
    ? billAmount - summary.estimatedMax
    : 0;

  const fillSample = () => {
    setCenterName("Authorized Service Center");
    setVehicle("Maruti Suzuki Baleno");
    setTotalBill("6100");
    setBillText("Engine oil change - 2800\nAir filter replacement - 950\nWheel alignment - 1100\nLabor charge - 1200");
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: BG, color: TEXT }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>Transparency feature</p>
          <h1 className="text-3xl font-black" style={{ color: TEXT }}>Service Bill Analyzer</h1>
          <p className="text-sm max-w-2xl" style={{ color: MUTED }}>
            Paste an invoice, and the app estimates a fair market range, flags suspicious charges, and shows a transparency score.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 rounded-2xl p-5 space-y-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: TEXT }}>Invoice Input</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>Use one line per item: item name and amount.</p>
              </div>
              <button
                onClick={fillSample}
                className="px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: PRIMARY, color: BG }}
              >
                Load Sample
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Service Center">
                <input value={centerName} onChange={(e) => setCenterName(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={fieldStyle} placeholder="Garage name" />
              </Field>
              <Field label="Vehicle">
                <input value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={fieldStyle} placeholder="Vehicle model" />
              </Field>
            </div>

            <Field label="Total Bill Amount">
              <input value={totalBill} onChange={(e) => setTotalBill(e.target.value)} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={fieldStyle} placeholder="e.g. 6100" />
            </Field>

            <Field label="Bill Items">
              <textarea
                value={billText}
                onChange={(e) => setBillText(e.target.value)}
                rows={10}
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={fieldStyle}
                placeholder={"Example:\nEngine oil change - 2800\nBrake pads - 4500"}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Recognized Items", value: summary.recognizedCount, color: SUCCESS },
                { label: "Unknown Lines", value: summary.unknownCount, color: WARNING },
                { label: "Fair Score", value: `${summary.score}/100`, color: transparencyState.color },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
                  <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>{card.label}</p>
                  <p className="text-2xl font-black mt-2" style={{ color: card.color }}>{card.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="lg:col-span-2 rounded-2xl p-5 space-y-4"
            style={{ background: CARD, border: `1px solid ${BORDER}` }}
          >
            <div>
              <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>Analysis</p>
              <h2 className="text-2xl font-black mt-1" style={{ color: transparencyState.color }}>{transparencyState.label}</h2>
            </div>

            <div className="rounded-2xl p-4" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>Estimated fair range</p>
                  <p className="text-2xl font-black mt-2" style={{ color: TEXT }}>
                    ₹{summary.estimatedMin.toLocaleString("en-IN")} - ₹{summary.estimatedMax.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: MUTED }}>Bill total</p>
                  <p className="text-lg font-bold" style={{ color: PRIMARY }}>
                    ₹{billAmount ? billAmount.toLocaleString("en-IN") : "--"}
                  </p>
                </div>
              </div>
              <div className="h-2 rounded-full mt-4 overflow-hidden" style={{ background: BG }}>
                <div className="h-full rounded-full" style={{ width: `${summary.score}%`, background: `linear-gradient(90deg, ${transparencyState.color}, ${PRIMARY})` }} />
              </div>
            </div>

            {overage > 0 && (
              <div className="rounded-2xl p-4" style={{ background: `${DANGER}12`, border: `1px solid ${DANGER}33` }}>
                <p className="text-sm font-semibold" style={{ color: DANGER }}>Possible overcharge detected</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  Bill is roughly ₹{overage.toLocaleString("en-IN")} above the estimated fair upper range.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="rounded-xl p-3" style={{ background: SURFACE, border: `1px solid ${item.flag === "high" ? DANGER : item.flag === "low" ? SUCCESS : BORDER}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: TEXT }}>{item.label}</p>
                      <p className="text-xs mt-1" style={{ color: MUTED }}>{item.raw}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: item.flag === "high" ? `${DANGER}20` : item.flag === "low" ? `${SUCCESS}18` : `${PRIMARY}16`, color: item.flag === "high" ? DANGER : item.flag === "low" ? SUCCESS : PRIMARY }}>
                      {item.flag === "high" ? "High" : item.flag === "low" ? "Low" : item.flag === "review" ? "Review" : "OK"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-2" style={{ color: MUTED }}>
                    <span>Suggested: ₹{Math.round((item.min + item.max) / 2).toLocaleString("en-IN")}</span>
                    <span>Range: ₹{Math.round(item.min).toLocaleString("en-IN")} - ₹{Math.round(item.max).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-4" style={{ background: `${PRIMARY}10`, border: `1px solid ${PRIMARY}22` }}>
              <p className="text-sm font-semibold" style={{ color: TEXT }}>What this means</p>
              <ul className="mt-2 space-y-2 text-xs" style={{ color: MUTED }}>
                <li>• Higher score means the bill is closer to estimated market pricing.</li>
                <li>• Unknown items reduce confidence and should be verified.</li>
                <li>• Very high amounts on known parts are flagged as possible overcharges.</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: MUTED }}>{label}</label>
      {children}
    </div>
  );
}

const fieldStyle = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  color: TEXT,
};
