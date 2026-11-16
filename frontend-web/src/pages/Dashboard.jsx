import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";
import { useAuth } from "../context/AuthContext";
import { T, formatNumber, urgencyStyle, buildComponentDetail } from "../components/Dashboard/dashboardUtils";
import VehicleVisual from "../components/Dashboard/VehicleVisual";
import DetailedReport from "../components/Dashboard/DetailedReport";
import ComponentDetailModal from "../components/Dashboard/ComponentDetailModal";
import BrandLogo from "../components/Dashboard/BrandLogo";
import {
  resolveVehicleProfile,
  findCatalogEntry,
  listVehicleOptions,
} from "../data/vehicleCatalog";
import { createDemoReport } from "../data/demoVehicle";
import {
  StatusStrip,
  ElectronicsCard,
  BatteryCard,
  VoltageCard,
  MotorCard,
  PerformanceStats,
  DashboardIcon,
} from "../components/Dashboard/DiagnosticCards";

const ICONS = {
  home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  reports: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6h.09A1.7 1.7 0 0 0 10 3.05V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.09A1.7 1.7 0 0 0 20.95 10H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  car: <><path d="m5 11 1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" /><path d="M3 16v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M9 17h6" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};

function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.8 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name] || ICONS.dashboard}
    </svg>
  );
}

function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="10" fill={T.blue} />
      <path d="M6 23 A10 10 0 0 1 26 23" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="16" y1="23" x2="10" y2="12" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="23" r="2.5" fill="#FFFFFF" />
      <line x1="24" y1="15" x2="22.4" y2="16.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="8" y1="15" x2="9.6" y2="16.5" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Brand logo is rendered dynamically via BrandLogo component.

function NavItem({ to, label, icon, active, onClick }) {
  const content = (
    <>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ background: active ? T.blueSoft : "transparent", color: active ? T.blue : T.muted }}>
        <Icon name={icon} size={18} color={active ? T.blue : T.muted} />
      </span>
      <span className="text-sm font-semibold" style={{ color: active ? T.text : T.muted }}>{label}</span>
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: T.blue }} />}
    </>
  );

  const classes = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50";

  if (to) return <Link to={to} className={classes}>{content}</Link>;
  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

function SidebarContent({ onSettings, onLogout, onHome, onDiagnostics }) {
  return (
    <>
      <div className="px-3">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: T.faint }}>Workspace</p>
        <nav className="mt-3 space-y-1">
          <NavItem label="Home" icon="home" onClick={onHome} />
          <NavItem label="Diagnostics" icon="dashboard" active onClick={onDiagnostics} />
          <NavItem to="/history" label="History" icon="reports" />
        </nav>
      </div>

      <div className="mt-8 px-3">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: T.faint }}>Account</p>
        <nav className="mt-3 space-y-1">
          <NavItem label="Settings" icon="settings" onClick={onSettings} />
          <NavItem label="Logout" icon="logout" onClick={onLogout} />
        </nav>
      </div>

      <div className="mt-auto px-4 pb-5">
        <div className="rounded-2xl border p-4" style={{ borderColor: "#BFDBFE", background: "linear-gradient(145deg, #EFF6FF 0%, #FFFFFF 100%)" }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.cyan})` }}>
            <DashboardIcon name="spark" size={17} color="#fff" />
          </span>
          <p className="mt-3 text-xs font-extrabold" style={{ color: T.text }}>AI health assistant</p>
          <p className="mt-1 text-[11px] leading-5" style={{ color: T.muted }}>
            Ask about faults, costs, or what to service next from diagnostics.
          </p>
        </div>
      </div>
    </>
  );
}

export default function Dashboard({ embedded = false }) {
  const navigate = useNavigate();
  const {
    vehicles, selectedVehicle, setSelected, setReport,
    report, loadVehicles, analyzeVehicle, analyzeQuick,
    applyVehicleInput, loadDemoVehicle, manualInput,
  } = useVehicle();
  const { user, logout } = useAuth();

  const [modelInput, setModelInput] = useState(manualInput || "");
  const [detailKey, setDetailKey] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [prefs, setPrefs] = useState({ criticalAlerts: true, weeklyDigest: false, compact: false });

  const abortRef = useRef(null);
  const reportAnchor = useRef(null);
  const diagnosticEntry = useRef(null);

  const vehicleOptions = useMemo(() => listVehicleOptions(), []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  useEffect(() => {
    if (manualInput) setModelInput(manualInput);
  }, [manualInput]);

  useEffect(() => {
    if (!selectedVehicle) return;
    setModelInput(
      `${selectedVehicle.manufacturer || ""} ${selectedVehicle.vehicle_model || ""}`.trim()
    );
  }, [selectedVehicle]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const effectiveVehicle = selectedVehicle;
  const vehicleProfile = useMemo(() => resolveVehicleProfile(effectiveVehicle), [effectiveVehicle]);
  const activeReport = useMemo(() => {
    if (!selectedVehicle || !report) return null;
    if (report.vehicle_id === selectedVehicle.id) return report;
    return null;
  }, [selectedVehicle, report]);

  const alerts = useMemo(() => {
    return (activeReport?.components || [])
      .filter((component) => component.urgency !== "good")
      .sort((a, b) => (a.urgency === "critical" ? -1 : 1));
  }, [activeReport]);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vehicles;
    return vehicles.filter((vehicle) =>
      `${vehicle.manufacturer || ""} ${vehicle.vehicle_model || ""} ${vehicle.manufacturing_year || ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [vehicles, search]);

  const initials = useMemo(() => {
    const source = user?.name?.trim() || user?.email || "DT";
    return source.split(/\s+/).map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase();
  }, [user]);

  const notificationCount = alerts.length + (activeReport?.top_alert ? 1 : 0);
  const score = activeReport ? Math.round(activeReport.overall_health_score) : null;
  const scoreColor = score == null ? T.faint : score >= 70 ? T.success : score >= 40 ? T.warning : T.danger;

  const selectVehicle = (vehicle) => {
    setReport(null);
    setSelected(vehicle);
    setVehicleOpen(false);
    setSearchOpen(false);
    setSearch("");
  };

  const handleModelChange = (value) => {
    setModelInput(value);
    if (value.trim().length < 3) return;
    // Live update as soon as the typed text resolves to a known model.
    if (findCatalogEntry(value)) applyVehicleInput(value);
  };

  const handleModelSubmit = (event) => {
    event.preventDefault();
    const value = modelInput.trim();
    if (!value) return;
    applyVehicleInput(value);
  };

  const handleAnalyze = async () => {
    const vehicle = selectedVehicle;
    if (!vehicle) return;
    if (vehicle._demo) {
      setReport(createDemoReport());
      return;
    }
    if (vehicle._unsaved || vehicle.id === 0) {
      const payload = {
        vehicle_model: vehicle.vehicle_model,
        manufacturer: vehicle.manufacturer,
        fuel_type: vehicle.fuel_type,
      };
      if (!vehicle._manual) {
        Object.assign(payload, {
          manufacturing_year: vehicle.manufacturing_year,
          mileage_km: vehicle.mileage_km,
          battery_age_months: vehicle.battery_age_months,
          brake_condition: vehicle.brake_condition,
          fuel_efficiency_kmpl: vehicle.fuel_efficiency_kmpl,
          has_unusual_noise: vehicle.has_unusual_noise,
          has_vibration: vehicle.has_vibration,
          has_reduced_mileage: vehicle.has_reduced_mileage,
          has_braking_issues: vehicle.has_braking_issues,
          additional_symptoms: vehicle.additional_symptoms,
          battery_voltage: vehicle.battery_voltage,
          engine_temp_c: vehicle.engine_temp_c,
          has_dtc: vehicle.has_dtc,
          dtc_codes: vehicle.dtc_codes,
          avg_speed_kmh: vehicle.avg_speed_kmh,
          engine_runtime_hours: vehicle.engine_runtime_hours,
        });
      }
      setAnalyzing(true);
      try {
        const next = await analyzeQuick(payload);
        if (next) setReport(next);
      } catch {
        // The vehicle context reports the API error; no local prediction is substituted.
      } finally {
        setAnalyzing(false);
      }
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setAnalyzing(true);
    try {
      const next = await analyzeVehicle(vehicle.id, { signal: controller.signal });
      if (next && !controller.signal.aborted) setReport(next);
    } catch {
      // The vehicle context reports the API error; no local prediction is substituted.
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setAnalyzing(false);
      }
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setAnalyzing(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const scrollToHome = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const scrollToReport = () => {
    const target = reportAnchor.current || diagnosticEntry.current;
    if (!target) return;
    const navHeight = document.querySelector("[data-site-navigation]")?.getBoundingClientRect().height || 0;
    const ownHeaderHeight = embedded ? 0 : 64;
    const top = window.scrollY + target.getBoundingClientRect().top - navHeight - ownHeaderHeight - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  };

  const handleLoadDemo = () => {
    loadDemoVehicle();
    window.setTimeout(scrollToReport, 120);
  };

  const scrollToDiagnostics = scrollToReport;

  const closeMenus = () => {
    setVehicleOpen(false);
    setSearchOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  const vehicleName = vehicleProfile.displayName;
  const componentDetail = useMemo(
    () => (detailKey ? buildComponentDetail(detailKey, activeReport, effectiveVehicle) : null),
    [detailKey, activeReport, effectiveVehicle]
  );

  return (
    <div className={embedded ? "min-h-0" : "min-h-screen"} style={{ background: T.bg, color: T.text }} onClick={closeMenus}>
      <header className={`${embedded ? "relative" : "sticky top-0"} z-40 h-16 border-b bg-white/95 backdrop-blur`}
        style={{ borderColor: T.border }}>
        <div className="mx-auto flex h-full max-w-[1600px] items-center gap-2 px-3 sm:gap-3 sm:px-5">

          {!embedded && (
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
              style={{ color: T.muted }} onClick={(event) => { event.stopPropagation(); setMobileNav(true); }}>
              <Icon name="menu" size={20} color={T.muted} />
            </button>
          )}

          <Link to="/" className="hidden flex-shrink-0 items-center gap-2.5 sm:flex"
            onClick={(event) => { event.stopPropagation(); if (embedded) scrollToHome(); }}>
            <Logo size={34} />
            <div className="hidden md:block">
              <p className="text-sm font-extrabold leading-4 tracking-tight" style={{ color: T.text }}>Drive Transparency</p>
              <p className="text-[10px] font-medium" style={{ color: T.faint }}>Vehicle intelligence</p>
            </div>
          </Link>

          <div className="relative ml-1 min-w-0" onClick={(event) => event.stopPropagation()}>
            <button type="button"
              onClick={() => { setVehicleOpen((open) => !open); setSearchOpen(false); setNotifOpen(false); setProfileOpen(false); }}
              className="flex h-11 max-w-[190px] items-center gap-2 rounded-xl border px-2.5 text-left transition-colors hover:bg-slate-50 sm:max-w-[240px]"
              style={{ borderColor: T.border, background: T.card }}>
              <BrandLogo
                brandKey={selectedVehicle ? vehicleProfile.brandKey : "generic"}
                brand={selectedVehicle ? vehicleProfile.brand : "Vehicle"}
                size={26}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: T.faint }}>
                  {selectedVehicle ? vehicleProfile.brand : "No vehicle"}
                </span>
                <span className="block truncate text-xs font-black" style={{ color: T.text }}>
                  {selectedVehicle ? vehicleProfile.model : "Enter model"}
                </span>
              </span>
              <Icon name="chevron" size={13} color={T.faint} />
            </button>

            <AnimatePresence>
              {vehicleOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute left-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border bg-white"
                  style={{ borderColor: T.border, boxShadow: T.shadow }}>
                  <div className="border-b px-4 py-3" style={{ borderColor: T.border }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.faint }}>Your vehicles</p>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {vehicles.length === 0 ? (
                      <p className="px-3 py-3 text-xs" style={{ color: T.muted }}>
                        No saved vehicles yet. Type a model in the panel above to begin.
                      </p>
                    ) : vehicles.map((vehicle) => {
                      const vp = resolveVehicleProfile(vehicle);
                      return (
                        <button key={vehicle.id} type="button" onClick={() => selectVehicle(vehicle)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50">
                          <BrandLogo brandKey={vp.brandKey} brand={vp.brand} size={30} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-bold" style={{ color: T.text }}>{vp.displayName}</span>
                            <span className="block text-[10px]" style={{ color: T.faint }}>
                              {vehicle.manufacturing_year} · {formatNumber(vehicle.mileage_km)} km
                            </span>
                          </span>
                          {selectedVehicle?.id === vehicle.id && <Icon name="check" size={15} color={T.blue} />}
                        </button>
                      );
                    })}
                  </div>
                  <Link to="/input" className="flex items-center gap-2 border-t px-4 py-3 text-xs font-bold"
                    style={{ borderColor: T.border, color: T.blue }}>
                    <Icon name="plus" size={14} color={T.blue} />
                    Add vehicle
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative ml-auto hidden w-56 lg:block" onClick={(event) => event.stopPropagation()}>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Icon name="search" size={15} color={T.faint} />
            </span>
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setSearchOpen(true); }}
              onFocus={() => { setSearchOpen(true); setVehicleOpen(false); setNotifOpen(false); setProfileOpen(false); }}
              placeholder="Search vehicles..."
              className="h-10 w-full rounded-xl border pl-9 pr-3 text-xs font-medium outline-none transition-all focus:ring-2"
              style={{ borderColor: T.border, background: T.surface, color: T.text, "--tw-ring-color": `${T.blue}33` }}
            />
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-white p-2"
                  style={{ borderColor: T.border, boxShadow: T.shadow }}>
                  {searchResults.length === 0 ? (
                    <p className="px-3 py-4 text-xs" style={{ color: T.muted }}>No vehicles match “{search}”.</p>
                  ) : searchResults.map((vehicle) => {
                    const vp = resolveVehicleProfile(vehicle);
                    return (
                      <button key={vehicle.id} type="button" onClick={() => selectVehicle(vehicle)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-50">
                        <BrandLogo brandKey={vp.brandKey} brand={vp.brand} size={28} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold" style={{ color: T.text }}>{vp.displayName}</span>
                          <span className="block text-[10px]" style={{ color: T.faint }}>{vehicle.manufacturing_year}</span>
                        </span>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button type="button" onClick={(event) => { event.stopPropagation(); closeMenus(); setViewerOpen(true); }}
            className="hidden h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold transition-colors hover:bg-slate-50 xl:flex"
            style={{ borderColor: T.border, background: T.card, color: T.text }}>
            <Icon name="car" size={15} color={T.blue} />
            360° View
          </button>

          <div className="relative" onClick={(event) => event.stopPropagation()}>
            <button type="button"
              onClick={() => { setNotifOpen((open) => !open); setVehicleOpen(false); setSearchOpen(false); setProfileOpen(false); }}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border transition-colors hover:bg-slate-50"
              style={{ borderColor: T.border, background: T.card }}>
              <Icon name="bell" size={17} color={T.muted} />
              {notificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white"
                  style={{ background: T.danger }}>{notificationCount}</span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-white"
                  style={{ borderColor: T.border, boxShadow: T.shadow }}>
                  <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: T.border }}>
                    <p className="text-xs font-extrabold" style={{ color: T.text }}>Notifications</p>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: T.surface, color: T.muted }}>
                      {notificationCount} new
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2">
                    {notificationCount === 0 ? (
                      <div className="px-3 py-6 text-center">
                        <Icon name="check" size={22} color={T.success} />
                        <p className="mt-2 text-xs font-bold" style={{ color: T.text }}>You're all caught up</p>
                        <p className="mt-0.5 text-[10px]" style={{ color: T.muted }}>No active vehicle alerts.</p>
                      </div>
                    ) : (
                      <>
                        {activeReport?.top_alert && (
                          <div className="mb-2 rounded-xl px-3 py-2.5" style={{ background: "#FEF2F2" }}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: T.danger }}>Priority alert</p>
                            <p className="mt-1 text-[11px] leading-5" style={{ color: "#991B1B" }}>{activeReport.top_alert}</p>
                          </div>
                        )}
                        {alerts.map((component) => {
                          const style = urgencyStyle(component.urgency);
                          return (
                            <div key={component.component} className="flex items-start gap-2.5 rounded-xl px-3 py-2.5"
                              style={{ background: style.soft }}>
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: style.color }} />
                              <div>
                                <p className="text-[11px] font-bold" style={{ color: style.color }}>
                                  {component.label || component.component}
                                </p>
                                <p className="mt-0.5 line-clamp-2 text-[10px] leading-4" style={{ color: T.muted }}>
                                  {component.explanation}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                  <button type="button" onClick={() => { setNotifOpen(false); scrollToReport(); }}
                    className="w-full border-t px-4 py-3 text-left text-[11px] font-bold"
                    style={{ borderColor: T.border, color: T.blue }}>
                    Open diagnostic report
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative" onClick={(event) => event.stopPropagation()}>
            <button type="button"
              onClick={() => { setProfileOpen((open) => !open); setVehicleOpen(false); setSearchOpen(false); setNotifOpen(false); }}
              className="flex h-10 items-center gap-2 rounded-xl border px-1.5 pr-2 transition-colors hover:bg-slate-50"
              style={{ borderColor: T.border, background: T.card }}>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-black text-white"
                style={{ background: `linear-gradient(135deg, ${T.blue}, ${T.cyan})` }}>{initials}</span>
              <Icon name="chevron" size={12} color={T.faint} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border bg-white"
                  style={{ borderColor: T.border, boxShadow: T.shadow }}>
                  <div className="border-b px-4 py-3" style={{ borderColor: T.border }}>
                    <p className="truncate text-xs font-extrabold" style={{ color: T.text }}>{user?.name || "Driver"}</p>
                    <p className="truncate text-[10px]" style={{ color: T.faint }}>{user?.email || "Signed in"}</p>
                  </div>
                  <button type="button" onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-xs font-semibold transition-colors hover:bg-slate-50"
                    style={{ color: T.text }}>
                    <Icon name="settings" size={15} color={T.muted} />
                    Settings
                  </button>
                  <button type="button" onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t px-4 py-3 text-left text-xs font-semibold transition-colors hover:bg-slate-50"
                    style={{ borderColor: T.border, color: T.danger }}>
                    <Icon name="logout" size={15} color={T.danger} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        {!embedded && (
          <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 flex-shrink-0 flex-col border-r bg-white py-5 lg:flex"
            style={{ borderColor: T.border }}>
            <SidebarContent
              onSettings={() => setSettingsOpen(true)}
              onLogout={handleLogout}
              onHome={scrollToHome}
              onDiagnostics={scrollToDiagnostics}
            />
          </aside>
        )}

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-7">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: T.faint }}>Vehicle health overview</p>
                {!selectedVehicle && (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]"
                    style={{ background: T.blueSoft, color: T.blue }}>
                    Awaiting vehicle
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl" style={{ color: T.text }}>
                Vehicle Diagnostics
              </h1>
              <p className="mt-1.5 text-xs font-medium" style={{ color: T.muted }}>
                {selectedVehicle
                  ? `${vehicleName} · vehicle profile and available diagnostic guidance.`
                  : "Enter your vehicle model to begin — the logo, 3D model and diagnostics update instantly."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={scrollToReport}
                className="rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-colors hover:bg-slate-50"
                style={{ borderColor: T.border, background: T.card, color: T.text }}>
                AI Report
              </button>
              <button type="button" onClick={() => selectedVehicle && setViewerOpen(true)} disabled={!selectedVehicle}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: T.blue, boxShadow: "0 8px 20px rgba(37,99,235,0.22)" }}>
                <Icon name="car" size={14} color="#fff" />
                360° View
              </button>
            </div>
          </div>

          <section ref={diagnosticEntry}
            className="scroll-mt-24 mb-5 rounded-2xl border bg-white p-4 sm:p-5"
            style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: T.faint }}>Vehicle model</p>
                <h2 className="mt-1 text-sm font-extrabold" style={{ color: T.text }}>Enter your vehicle model</h2>
                <form className="mt-2 flex flex-col gap-2 sm:flex-row" onSubmit={handleModelSubmit}>
                  <input
                    value={modelInput}
                    onChange={(event) => handleModelChange(event.target.value)}
                    list="dashboard-vehicle-suggestions"
                    placeholder="e.g. Tesla Model Y, BMW X5, Hyundai Creta, Mahindra Thar"
                    aria-label="Vehicle model"
                    className="h-11 w-full rounded-xl border px-3 text-sm font-medium outline-none transition-all focus:ring-2"
                    style={{ borderColor: T.border, background: T.surface, color: T.text, "--tw-ring-color": `${T.blue}33` }}
                  />
                  <datalist id="dashboard-vehicle-suggestions">
                    {vehicleOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.bodyLabel}</option>
                    ))}
                  </datalist>
                  <button type="submit"
                    className="h-11 flex-shrink-0 rounded-xl px-5 text-sm font-bold text-white"
                    style={{ background: T.blue, boxShadow: "0 8px 18px rgba(37,99,235,0.22)" }}>
                    Set vehicle
                  </button>
                </form>
                <p className="mt-1 text-[10px]" style={{ color: T.faint }}>
                  Type any make/model; suggestions are optional. This selects a profile, not sensor data.
                </p>
              </div>
              <div className="flex-shrink-0 text-[11px] lg:text-right" style={{ color: T.muted }}>
                {selectedVehicle ? (
                  <>
                    <p className="font-bold" style={{ color: T.text }}>{vehicleProfile.displayName}</p>
                    <p>
                      {vehicleProfile.bodyLabel}{vehicleProfile.electric ? " · EV" : ""}
                      {vehicleProfile.matched ? " · exact model" : " · closest body style"}
                    </p>
                  </>
                ) : (
                  <p>Vehicle not selected</p>
                )}
                <button type="button" onClick={() => navigate("/input")}
                  className="mt-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors hover:bg-blue-50"
                  style={{ borderColor: "#BFDBFE", color: T.blue, background: "#EFF6FF" }}>
                  Enter readings &amp; symptoms
                </button>
                <button type="button" onClick={handleLoadDemo}
                  className="mt-2 rounded-xl border px-3 py-2 text-xs font-bold transition-colors hover:bg-amber-50"
                  style={{ borderColor: "#FCD34D", color: "#92400E", background: "#FFFBEB" }}>
                  Load sample car
                </button>
              </div>
              <p className="text-[11px] leading-5 lg:max-w-sm" style={{ color: T.muted }}>
                Selecting a model loads its visual profile only. No live OBD data is connected; enter observed readings or symptoms to run a health check.
              </p>
            </div>
          </section>

          {!selectedVehicle ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border bg-white px-6 py-14 text-center"
              style={{ borderColor: T.border, boxShadow: T.shadowSm }}>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: T.blueSoft }}>
                <BrandLogo brandKey="generic" brand="Vehicle" size={36} />
              </span>
              <h2 className="mt-4 text-lg font-extrabold" style={{ color: T.text }}>Enter your vehicle model to begin</h2>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-5" style={{ color: T.muted }}>
                Type a model above, for example <span className="font-semibold">Tesla Model Y</span>,
                <span className="font-semibold"> BMW X5</span>, <span className="font-semibold">Hyundai Creta</span> or
                <span className="font-semibold"> Mahindra Thar</span>, to load the matching logo, 3D vehicle, specs and diagnostics.
              </p>
            </motion.div>
          ) : (
          <div className="space-y-5">
            <StatusStrip
              report={activeReport}
              vehicle={effectiveVehicle}
              analyzing={analyzing}
              onAnalyze={handleAnalyze}
              onStop={handleStop}
              onShowReport={scrollToReport}
            />
            {effectiveVehicle._demo && (
              <div role="note" className="rounded-xl border px-4 py-3 text-xs leading-5"
                style={{ borderColor: "#FCD34D", background: "#FFFBEB", color: "#78350F" }}>
                <strong>DEMO SAMPLE — NOT REAL VEHICLE DATA.</strong> BMW X1 readings below are illustrative and included only to demonstrate the report. No live OBD connection or trained ML model is being used.
              </div>
            )}

            <motion.section
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border bg-white"
              style={{ borderColor: T.border, boxShadow: T.shadow }}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4" style={{ borderColor: T.border }}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: T.surface }}>
                        <BrandLogo brandKey={vehicleProfile.brandKey} brand={vehicleProfile.brand} size={25} />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: T.faint }}>
                          {effectiveVehicle._demo ? "Demo sample" : effectiveVehicle._manual ? "Manual vehicle profile" : "Saved vehicle profile"} · {vehicleProfile.bodyLabel}{vehicleProfile.electric ? " · EV" : ""}
                        </p>
                        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: T.text }}>{vehicleName}</h2>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: T.muted }}>
                      <span>{effectiveVehicle.manufacturing_year} model</span>
                      <span>·</span>
                      <span>{formatNumber(effectiveVehicle.mileage_km)} km</span>
                      <span>·</span>
                      <span className="capitalize">{effectiveVehicle.fuel_type || "Petrol"}</span>
                      {effectiveVehicle._demo
                        ? <span className="rounded-full px-2 py-0.5 font-bold" style={{ background: "#FEF3C7", color: "#92400E" }}>Demo sample</span>
                        : effectiveVehicle._manual && <span className="rounded-full px-2 py-0.5 font-bold" style={{ background: T.blueSoft, color: T.blue }}>Manual entry</span>}
                      {effectiveVehicle._unsaved && !effectiveVehicle._manual && <span className="font-bold" style={{ color: T.warning }}>Unsaved analysis</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-2xl font-black leading-none" style={{ color: scoreColor }}>{score ?? "--"}</p>
                      <p className="text-[10px] font-semibold" style={{ color: T.faint }}>/ 100 health</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
                      style={{ background: T.blueSoft, color: T.blue }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: analyzing ? T.warning : T.blue }} />
                      {analyzing ? "Scanning" : effectiveVehicle._demo ? "Demo only" : "Manual"}
                    </span>
                    <button type="button" onClick={() => setViewerOpen(true)}
                      className="rounded-lg border px-2.5 py-2 text-[10px] font-bold transition-colors hover:bg-slate-50"
                      style={{ borderColor: T.border, color: T.text }}>
                      360°
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <VehicleVisual
                    report={activeReport}
                    vehicle={effectiveVehicle}
                    onSelect={setDetailKey}
                    className="min-h-[430px] sm:min-h-[540px] xl:min-h-[620px]"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t px-5 py-3" style={{ borderColor: T.border }}>
                  {[
                    { label: vehicleProfile.electric ? "Motor" : "Engine", key: vehicleProfile.electric ? "motor" : "engine" },
                    { label: "Brakes", key: "brakes" },
                    { label: "Battery", key: "battery" },
                    { label: "Climate", key: "climate" },
                    { label: "Camera", key: "camera" },
                    { label: "Radar", key: "radar" },
                  ].map(({ label, key }) => {
                    const component = activeReport?.components?.find((item) =>
                      item.component === key
                      || (key === "engine" && item.component === "engine_oil")
                      || (key === "motor" && item.component === "engine")
                    );
                    const style = component ? urgencyStyle(component.urgency) : null;
                    return (
                      <button key={key} type="button" onClick={() => setDetailKey(key)}
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-transform hover:-translate-y-0.5"
                        style={{ background: style ? style.soft : T.surface, color: style ? style.color : T.faint }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: style ? style.color : T.faint }} />
                        {label}
                      </button>
                    );
                  })}
                </div>
            </motion.section>

            <ElectronicsCard report={activeReport} vehicle={effectiveVehicle} onSelect={setDetailKey} />

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <BatteryCard report={activeReport} vehicle={effectiveVehicle} onSelect={() => setDetailKey("battery")} />
              <VoltageCard report={activeReport} vehicle={effectiveVehicle} onSelect={() => setDetailKey("voltage")} />
              <MotorCard report={activeReport} vehicle={effectiveVehicle} onSelect={() => setDetailKey("motor")} className="md:col-span-2 xl:col-span-1" />
            </div>

            <PerformanceStats vehicle={effectiveVehicle} />

            <div id={activeReport ? "diagnostics" : undefined} ref={reportAnchor} className="scroll-mt-24">
              <DetailedReport report={activeReport} selectedVehicle={effectiveVehicle} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
              <p className="text-[11px]" style={{ color: T.faint }}>
                {activeReport ? `Generated ${new Date(activeReport.generated_at).toLocaleString("en-IN")}` : "Awaiting first analysis"}
              </p>
              <button type="button" onClick={() => navigate("/history")}
                className="text-[11px] font-bold" style={{ color: T.blue }}>
                View service history →
              </button>
            </div>
          </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {viewerOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
            <button type="button" aria-label="Close 360 view"
              className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={() => setViewerOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="relative max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border bg-white"
              style={{ borderColor: T.border, boxShadow: T.shadow }}>
              <div className="flex items-start justify-between border-b px-5 py-4" style={{ borderColor: T.border }}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: T.faint }}>Interactive 360° view</p>
                  <h2 className="mt-0.5 text-lg font-black" style={{ color: T.text }}>{vehicleName}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-flex"
                    style={{ background: T.blueSoft, color: T.blue }}>
                    Left-drag anywhere to rotate
                  </span>
                  <button type="button" onClick={() => setViewerOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border transition-colors hover:bg-slate-50"
                    style={{ borderColor: T.border, color: T.muted }}>
                    <Icon name="close" size={16} color={T.muted} />
                  </button>
                </div>
              </div>
              <div className="bg-[radial-gradient(circle_at_50%_45%,#EFF6FF_0%,#F8FAFC_45%,#FFFFFF_100%)]">
                <VehicleVisual
                  report={activeReport}
                  vehicle={effectiveVehicle}
                  onSelect={(key) => { setViewerOpen(false); setDetailKey(key); }}
                  className="min-h-[420px] sm:min-h-[520px]"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3" style={{ borderColor: T.border }}>
                <p className="text-[11px]" style={{ color: T.muted }}>
                  Select a vehicle marker to inspect component health and service guidance.
                </p>
                <button type="button" onClick={() => { setViewerOpen(false); scrollToReport(); }}
                  className="text-[11px] font-bold" style={{ color: T.blue }}>
                  Open full diagnostic report →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {componentDetail && (
          <ComponentDetailModal
            detail={componentDetail}
            onClose={() => setDetailKey(null)}
            onReport={() => { setDetailKey(null); setTimeout(scrollToReport, 80); }}
            onAnalyze={() => { setDetailKey(null); handleAnalyze(); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!embedded && mobileNav && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden">
            <button type="button" aria-label="Close navigation"
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setMobileNav(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="relative flex h-full w-72 flex-col border-r bg-white py-5"
              style={{ borderColor: T.border }}>
              <div className="mb-5 flex items-center justify-between px-4">
                <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileNav(false)}>
                  <Logo size={30} />
                  <span className="text-sm font-extrabold" style={{ color: T.text }}>Drive Transparency</span>
                </Link>
                <button type="button" onClick={() => setMobileNav(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: T.muted }}>
                  <Icon name="close" size={17} color={T.muted} />
                </button>
              </div>
              <div onClick={() => setMobileNav(false)}>
                <SidebarContent
                  onSettings={() => { setMobileNav(false); setSettingsOpen(true); }}
                  onLogout={handleLogout}
                  onHome={scrollToHome}
                  onDiagnostics={scrollToDiagnostics}
                />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" aria-label="Close settings"
              className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setSettingsOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-white"
              style={{ borderColor: T.border, boxShadow: T.shadow }}>
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: T.border }}>
                <div>
                  <p className="text-sm font-extrabold" style={{ color: T.text }}>Diagnostics settings</p>
                  <p className="text-[11px]" style={{ color: T.muted }}>Control your diagnostic preferences.</p>
                </div>
                <button type="button" onClick={() => setSettingsOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: T.muted }}>
                  <Icon name="close" size={17} color={T.muted} />
                </button>
              </div>
              <div className="space-y-3 p-5">
                {[
                  { key: "criticalAlerts", title: "Critical alerts", detail: "Highlight urgent component failures first." },
                  { key: "weeklyDigest", title: "Weekly digest", detail: "Show a weekly maintenance summary." },
                  { key: "compact", title: "Compact cards", detail: "Reduce spacing in diagnostic sections." },
                ].map((item) => (
                  <button key={item.key} type="button"
                    onClick={() => setPrefs((current) => ({ ...current, [item.key]: !current[item.key] }))}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition-colors hover:bg-slate-50"
                    style={{ borderColor: T.border }}>
                    <span>
                      <span className="block text-xs font-bold" style={{ color: T.text }}>{item.title}</span>
                      <span className="block text-[10px]" style={{ color: T.muted }}>{item.detail}</span>
                    </span>
                    <span className="relative h-5 w-9 flex-shrink-0 rounded-full transition-colors"
                      style={{ background: prefs[item.key] ? T.blue : "#CBD5E1" }}>
                      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all"
                        style={{ left: prefs[item.key] ? 18 : 2 }} />
                    </span>
                  </button>
                ))}
              </div>
              <div className="border-t px-5 py-4" style={{ borderColor: T.border }}>
                <button type="button" onClick={() => setSettingsOpen(false)}
                  className="w-full rounded-xl py-2.5 text-xs font-bold text-white"
                  style={{ background: T.blue }}>
                  Save preferences
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {analyzing && report && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border bg-white px-4 py-2 text-[11px] font-bold"
            style={{ borderColor: T.border, color: T.blue, boxShadow: T.shadow }}>
            <span className="mr-2 inline-flex items-center gap-1">
              {[0, 1, 2].map((n) => (
                <motion.span key={n} className="h-1.5 w-1.5 rounded-full" style={{ background: T.blue }}
                  animate={{ opacity: [0.25, 1, 0.25] }} transition={{ duration: 1, repeat: Infinity, delay: n * 0.18 }} />
              ))}
            </span>
            Re-analyzing vehicle systems
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
