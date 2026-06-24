import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { VehicleProvider } from "./context/VehicleContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const VehicleInput = lazy(() => import("./pages/VehicleInput"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CarMode = lazy(() => import("./pages/CarMode"));
const ServiceHistory = lazy(() => import("./pages/ServiceHistory"));
const BillAnalyzer = lazy(() => import("./pages/BillAnalyzer"));
const AuraBot = lazy(() => import("./components/AuraBot"));

const BG   = "#1C1C1C";
const CARD = "#272727";
const PRI  = "#DDD0C8";

function AppFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16" style={{ color: PRI }}>
      <div className="max-w-sm w-full rounded-2xl p-6 text-center" style={{ background: CARD, border: "1px solid #3D3D3D" }}>
        <div className="w-10 h-10 mx-auto rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: PRI, borderTopColor: "transparent" }} />
        <p className="mt-4 text-sm" style={{ color: "#8C8480" }}>Loading Drive Transparency...</p>
      </div>
    </div>
  );
}

function DtLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Beige background — pops against dark navbar */}
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

  return (
    <nav style={{ background: CARD, borderBottom: "1px solid #3D3D3D" }} className="px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2.5 font-bold" style={{ color: "#F0EBE5", textDecoration: "none" }}>
        <DtLogo size={30} />
        <span style={{ letterSpacing: "0.02em" }}>Drive Transparency</span>
      </Link>

      <div className="flex items-center gap-5 text-sm">
        {[
          { to: "/",        label: "Home" },
          { to: "/input",   label: "Check Vehicle" },
          { to: "/dashboard", label: "Dashboard" },
          { to: "/bill-analyzer", label: "Bill Analyzer" },
          { to: "/history", label: "Service History" },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{ color: loc.pathname === to ? PRI : "#8C8480", fontWeight: loc.pathname === to ? 600 : 400 }}
            className="hover:opacity-80 transition-opacity"
          >
            {label}
          </Link>
        ))}
        <Link to="/car-mode" style={{ color: PRI, opacity: 0.8 }} className="hover:opacity-100 transition-opacity font-medium">
          🚘 Car Mode
        </Link>

        {user ? (
          <div className="flex items-center gap-3 ml-2 pl-4" style={{ borderLeft: "1px solid #3D3D3D" }}>
            <span className="text-xs" style={{ color: "#8C8480" }}>{user.name}</span>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "#323232", color: "#8C8480", border: "1px solid #3D3D3D" }}
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
                <Route path="/login"     element={<Login />} />
                <Route path="/car-mode"  element={<CarMode />} />
                <Route path="/input"     element={<Protected><VehicleInput /></Protected>} />
                <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
                <Route path="/bill-analyzer" element={<Protected><BillAnalyzer /></Protected>} />
                <Route path="/history"   element={<Protected><ServiceHistory /></Protected>} />
                <Route path="*"          element={<Navigate to="/" replace />} />
              </Routes>
              <AuraBot />
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: "#272727", color: "#F0EBE5", border: "1px solid #3D3D3D" },
              }}
            />
          </div>
        </BrowserRouter>
      </VehicleProvider>
    </AuthProvider>
  );
}
