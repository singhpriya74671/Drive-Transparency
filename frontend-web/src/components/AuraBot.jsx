import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CARD    = "#272727";
const SURFACE = "#323232";
const PRIMARY = "#DDD0C8";
const TEXT    = "#F0EBE5";
const MUTED   = "#8C8480";
const BORDER  = "#3D3D3D";
const BG      = "#1C1C1C";

const RESPONSES = {
  oil:     "Engine oil changes are recommended every 5,000–10,000 km depending on oil type. If your last change was over 6 months ago, it is due soon.",
  brake:   "Brake pads typically last 40,000–70,000 km. Squealing sounds or reduced braking response are warning signs — inspect immediately.",
  battery: "Car batteries last 2–4 years on average. If yours is older than 2 years, request a load test at your next service visit.",
  tyre:    "Tyre rotation every 10,000 km ensures even wear and extends tyre life. Check tyre pressure monthly for best fuel efficiency.",
  next:    "I recommend: 1) Brake inspection (high urgency), 2) Engine oil change (due soon), 3) Battery load test. Book a service in the next 2–4 weeks.",
  score:   "Your health score is calculated across 8 components: engine oil, battery, brakes, tyres, coolant, fuel system, transmission, and spark plugs.",
  cost:    "Service cost estimates are based on current market rates for your vehicle type. Actual costs may vary by garage and location.",
  default: "I can help with oil changes, brake condition, battery life, tyre maintenance, service costs, or what to service next. What would you like to know?",
};

function getReply(msg) {
  const q = msg.toLowerCase();
  if (q.includes("oil") || q.includes("engine"))             return RESPONSES.oil;
  if (q.includes("brake") || q.includes("braking"))          return RESPONSES.brake;
  if (q.includes("battery") || q.includes("charge"))         return RESPONSES.battery;
  if (q.includes("tyre") || q.includes("tire") || q.includes("wheel")) return RESPONSES.tyre;
  if (q.includes("cost") || q.includes("price") || q.includes("₹"))    return RESPONSES.cost;
  if (q.includes("score") || q.includes("health") || q.includes("how")) return RESPONSES.score;
  if (q.includes("next") || q.includes("month") || q.includes("service") || q.includes("what")) return RESPONSES.next;
  return RESPONSES.default;
}

export default function AuraBot() {
  const [open, setOpen]     = useState(false);
  const [input, setInput]   = useState("");
  const [chat, setChat]     = useState([
    { role: "bot", text: "Hi! I am AuraBot 🤖 Ask me anything about your vehicle maintenance." }
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const send = () => {
    if (!input.trim()) return;
    const q = input.trim();
    setChat(p => [...p, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setChat(p => [...p, { role: "bot", text: getReply(q) }]);
      setLoading(false);
    }, 700);
  };

  return (
    <>
      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.85, y: 20  }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            style={{
              position:     "fixed",
              bottom:       90,
              right:        24,
              width:        320,
              height:       420,
              background:   CARD,
              border:       `1px solid ${BORDER}`,
              borderRadius: 20,
              display:      "flex",
              flexDirection:"column",
              zIndex:       1000,
              boxShadow:    "0 24px 60px rgba(0,0,0,0.5)",
              overflow:     "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              background: SURFACE,
              borderBottom: `1px solid ${BORDER}`,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `${PRIMARY}22`, border: `1px solid ${PRIMARY}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🤖</div>
                <div>
                  <p style={{ color: TEXT, fontWeight: 700, fontSize: 14, margin: 0 }}>AuraBot</p>
                  <p style={{ color: "#4CAF7D", fontSize: 11, margin: 0 }}>● Online</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: MUTED, fontSize: 18, cursor: "pointer", padding: 4 }}
              >✕</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 8px", display: "flex", flexDirection: "column", gap: 10 }}>
              {chat.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "bot" && (
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${PRIMARY}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, marginRight: 7, flexShrink: 0, alignSelf: "flex-end" }}>
                      🤖
                    </div>
                  )}
                  <div style={{
                    maxWidth: "78%",
                    padding: "9px 13px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user" ? PRIMARY : SURFACE,
                    color:      m.role === "user" ? BG      : TEXT,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${PRIMARY}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
                  <div style={{ background: SURFACE, borderRadius: "16px 16px 16px 4px", padding: "9px 14px" }}>
                    <span style={{ color: MUTED, fontSize: 18, letterSpacing: 3 }}>···</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick suggestions */}
            <div style={{ padding: "0 12px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Oil change?", "Check brakes", "Next service"].map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); }}
                  style={{
                    background: SURFACE, border: `1px solid ${BORDER}`,
                    color: MUTED, fontSize: 11, padding: "4px 10px",
                    borderRadius: 20, cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 12px 14px",
              borderTop: `1px solid ${BORDER}`,
              display: "flex", gap: 8,
            }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Ask about your vehicle..."
                style={{
                  flex: 1, background: SURFACE, border: `1px solid ${BORDER}`,
                  borderRadius: 12, padding: "9px 12px", color: TEXT,
                  fontSize: 13, outline: "none", fontFamily: "inherit",
                }}
                onFocus={e  => (e.target.style.borderColor = PRIMARY)}
                onBlur={e   => (e.target.style.borderColor = BORDER)}
              />
              <button
                onClick={send}
                style={{
                  background: PRIMARY, border: "none", borderRadius: 12,
                  padding: "9px 14px", color: BG, fontWeight: 700,
                  fontSize: 14, cursor: "pointer", flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position:     "fixed",
          bottom:       24,
          right:        24,
          width:        56,
          height:       56,
          borderRadius: "50%",
          background:   open ? SURFACE : PRIMARY,
          border:       `2px solid ${open ? BORDER : PRIMARY}`,
          cursor:       "pointer",
          zIndex:       1001,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          fontSize:     24,
          boxShadow:    `0 8px 30px rgba(0,0,0,0.4), 0 0 0 ${open ? 0 : 4}px ${PRIMARY}22`,
          transition:   "background 0.2s, box-shadow 0.2s",
        }}
      >
        {open ? "✕" : "🤖"}
      </motion.button>
    </>
  );
}
