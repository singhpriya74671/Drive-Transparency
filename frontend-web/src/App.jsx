import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { VehicleProvider } from "./context/VehicleContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

const Home = lazy(() => import("./pages/Home"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const VehicleInput = lazy(() => import("./pages/VehicleInput"));
const CarMode = lazy(() => import("./pages/CarMode"));
const ServiceHistory = lazy(() => import("./pages/ServiceHistory"));
const BillAnalyzer = lazy(() => import("./pages/BillAnalyzer"));
const AuraBot = lazy(() => import("./components/AuraBot"));

const BG   = "#FFFFFF";
const CARD = "#FFFFFF";
const PRI  = "#2563EB";
const BORDER = "#E2E8F0";
const TEXT = "#0F172A";
const MUTED = "#64748B";

function AppFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ color: PRI }}>
      <div className="max-w-sm w-full rounded-2xl p-6 text-center" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
        <div className="w-10 h-10 mx-auto rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: PRI, borderTopColor: "transparent" }} />
        <p className="mt-4 text-sm" style={{ color: MUTED }}>Loading Drive Transparency...</p>
      </div>
    </div>
  );
}

function DtLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Blue mark contrasts with the light navigation bar. */}
      <rect width="32" height="32" rx="9" fill={PRI} />
      {/* Arc */}
      <path d="M6 23 A10 10 0 0 1 26 23" stroke="#1C1C1C" strokeWidth="2.2" strokeLinecap="round" />
      {/* Needle */}
      <line x1="16" y1="23" x2="10" y2="12" stroke="#1C1C1C" strokeWidth="2.4" strokeLinecap="round" />
      {/* Center dot */}
      <circle cx="16" cy="23" r="2.5" fill="#1C1C1C" />
      {/* Ticks */}
      <line x1="24" y1="15" x2="22.4" y2="16.5" stroke="#1C1C1C" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="8"  y1="15" x2="9.6"  y2="16.5" stroke="#1C1C1C" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* Protect routes — redirect to /login if not authenticated */
function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function Navbar() {
  const loc      = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (loc.pathname === "/car-mode" || loc.pathname === "/login") return null;

  const goHome = () => {
    if (loc.pathname === "/") {
      if (loc.hash) navigate("/", { replace: true });
    } else {
      navigate("/");
    }
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const goToDiagnostics = () => {
    if (loc.pathname === "/diagnostics") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/diagnostics");
    }
  };

  return (
    <nav data-site-navigation="true"
      style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50 }}
      className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
      <Link
        to="/"
        onClick={() => loc.pathname === "/" && window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex items-center gap-2.5 font-bold"
        style={{ color: TEXT, textDecoration: "none" }}
      >
        <DtLogo size={30} />
        <span style={{ letterSpacing: "0.02em" }}>Drive Transparency</span>
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm">
        <button type="button" onClick={goHome}
          style={{ color: loc.pathname === "/" && !loc.hash ? PRI : MUTED }}
          className="hover:opacity-80 transition-opacity">
          Home
        </button>
        <button type="button" onClick={goToDiagnostics}
          style={{ color: loc.pathname === "/diagnostics" ? PRI : MUTED }}
          className="hover:opacity-80 transition-opacity">
          Diagnostics
        </button>
        <Link to="/input" style={{ color: loc.pathname === "/input" ? PRI : MUTED }}
          className="hover:opacity-80 transition-opacity">
          Check Vehicle
        </Link>
        <Link to="/bill-analyzer" style={{ color: loc.pathname === "/bill-analyzer" ? PRI : MUTED }}
          className="hover:opacity-80 transition-opacity">
          Bill Analyzer
        </Link>
        <Link to="/history" style={{ color: loc.pathname === "/history" ? PRI : MUTED }}
          className="hover:opacity-80 transition-opacity">
          History
        </Link>
        <Link to="/car-mode" style={{ color: PRI }} className="hover:opacity-80 transition-opacity font-medium">
          🚘 Car Mode
        </Link>

        {user ? (
          <div className="flex items-center gap-3 ml-2 pl-4" style={{ borderLeft: `1px solid ${BORDER}` }}>
            <span className="text-xs" style={{ color: MUTED }}>{user.name}</span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "#F1F5F9", color: MUTED, border: `1px solid ${BORDER}` }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="text-xs px-4 py-1.5 rounded-lg font-semibold ml-2"
            style={{ background: PRI, color: BG }}
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <VehicleProvider>
        <BrowserRouter>
          <div className="min-h-screen" style={{ background: BG }}>
            <Navbar />
            <Suspense fallback={<AppFallback />}>
              <Routes>
                <Route path="/"          element={<Home />} />
                <Route path="/diagnostics" element={<Dashboard embedded />} />
                <Route path="/home"      element={<Navigate to="/" replace />} />
                <Route path="/login"     element={<Login />} />
                <Route path="/car-mode"  element={<CarMode />} />
                <Route path="/input"     element={<VehicleInput />} />
                <Route path="/bill-analyzer" element={<BillAnalyzer />} />
                <Route path="/history"   element={<Protected><ServiceHistory /></Protected>} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
              <AuraBot />
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: "#FFFFFF", color: TEXT, border: `1px solid ${BORDER}` },
              }}
            />
          </div>
        </BrowserRouter>
      </VehicleProvider>
    </AuthProvider>
  );
}
