import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const BG      = "#1C1C1C";
const CARD    = "#272727";
const SURFACE = "#323232";
const PRIMARY = "#DDD0C8";
const TEXT    = "#F0EBE5";
const MUTED   = "#8C8480";
const BORDER  = "#3D3D3D";

export default function Login() {
  const [mode, setMode]   = useState("login"); // "login" | "register"
  const [form, setForm]   = useState({ name: "", email: "", password: "" });
  const { login, register, loading } = useAuth();
  const navigate = useNavigate();

  const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === "register") {
        if (!form.name.trim()) return toast.error("Please enter your name.");
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate("/input");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: BG }}
    >
      {/* Background decoration — car dashboard rings */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-5"
          style={{ border: `60px solid ${PRIMARY}` }} />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-5"
          style={{ border: `40px solid ${PRIMARY}` }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-3"
          style={{ border: `1px solid ${BORDER}` }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <span className="text-3xl">🚗</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: TEXT }}>Drive Transparency</h1>
          <p className="text-sm mt-1" style={{ color: MUTED }}>AI-Powered Vehicle Health Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          {/* Tab */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: SURFACE }}>
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: mode === m ? PRIMARY : "transparent",
                  color:      mode === m ? BG      : MUTED,
                }}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: MUTED }}>Full Name</label>
                <input
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }}
                  placeholder="Your full name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                  onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                  onBlur={(e)  => (e.target.style.borderColor = BORDER)}
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: MUTED }}>Email Address</label>
              <input
                type="email"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                onBlur={(e)  => (e.target.style.borderColor = BORDER)}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: MUTED }}>Password</label>
              <input
                type="password"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT }}
                placeholder={mode === "register" ? "Minimum 6 characters" : "Your password"}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                required
                onFocus={(e) => (e.target.style.borderColor = PRIMARY)}
                onBlur={(e)  => (e.target.style.borderColor = BORDER)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2"
              style={{ background: PRIMARY, color: BG, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          <p className="text-xs text-center mt-5" style={{ color: MUTED }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="underline"
              style={{ color: PRIMARY }}
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="text-xs text-center mt-5" style={{ color: "#555" }}>
          Your data is stored locally and never shared.
        </p>
      </motion.div>
    </div>
  );
}
