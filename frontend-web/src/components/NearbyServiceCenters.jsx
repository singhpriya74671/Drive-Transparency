import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";
import { T } from "./Dashboard/dashboardUtils";
import {
  brandMatchesText,
  brandOverpassPattern,
  getBrandProfile,
  getVehicleLabel,
} from "../utils/serviceCenterBrands";

const CARD    = T.card;
const SURFACE = T.surface;
const PRIMARY = T.blue;
const TEXT    = T.text;
const MUTED   = T.muted;
const BORDER  = T.border;
const BG      = T.surface;
const ON_PRIMARY = "#FFFFFF";

const LOCAL_RADIUS_M = 6000;
const AUTHORIZED_RADIUS_M = 30000;

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildOverpassQuery(lat, lon, brandProfile) {
  const localQuery = `
  node["amenity"="car_repair"](around:${LOCAL_RADIUS_M},${lat},${lon});
  node["shop"="car_repair"](around:${LOCAL_RADIUS_M},${lat},${lon});
  node["amenity"="car_service"](around:${LOCAL_RADIUS_M},${lat},${lon});
  node["shop"="vehicle"](around:${LOCAL_RADIUS_M},${lat},${lon});`;

  const authorizedQuery = brandProfile?.terms?.length
    ? brandProfile.terms.slice(0, 4).map((term) => {
        const pattern = brandOverpassPattern(term);
        return `
  nwr["amenity"="car_repair"](around:${AUTHORIZED_RADIUS_M},${lat},${lon})["name"~"${pattern}",i];
  nwr["shop"="car_repair"](around:${AUTHORIZED_RADIUS_M},${lat},${lon})["name"~"${pattern}",i];
  nwr["amenity"="car_service"](around:${AUTHORIZED_RADIUS_M},${lat},${lon})["name"~"${pattern}",i];
  nwr["shop"="car"](around:${AUTHORIZED_RADIUS_M},${lat},${lon})["brand"~"${pattern}",i];
  nwr["shop"="car"](around:${AUTHORIZED_RADIUS_M},${lat},${lon})["operator"~"${pattern}",i];
  nwr["shop"="car"](around:${AUTHORIZED_RADIUS_M},${lat},${lon})["name"~"${pattern}",i];`;
      }).join("")
    : "";

  return `[out:json][timeout:30];(${localQuery}${authorizedQuery});out center;`;
}

export default function NearbyServiceCenters({ vehicle }) {
  const { selectedVehicle } = useVehicle();
  const activeVehicle = vehicle || selectedVehicle;
  const brandProfile = useMemo(() => getBrandProfile(activeVehicle), [activeVehicle]);
  const brand = brandProfile?.label || null;
  const vehicleLabel = getVehicleLabel(activeVehicle);

  const [phase, setPhase]       = useState("idle"); // idle|locating|loading|done|error
  const [centers, setCenters]   = useState([]);
  const [userLoc, setUserLoc]   = useState(null);
  const [filter, setFilter]     = useState("all");
  const [errMsg, setErrMsg]     = useState("");
  const [expanded, setExpanded] = useState(null);
  const previousBrand = useRef(brand);

  const fetchCenters = useCallback(async (lat, lon) => {
    setPhase("loading");
    try {
      const query = buildOverpassQuery(lat, lon, brandProfile);

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const uniqueElements = new Map();
      (data.elements || []).forEach((element) => {
        const elementLat = element.lat ?? element.center?.lat;
        const elementLon = element.lon ?? element.center?.lon;
        if (Number.isFinite(elementLat) && Number.isFinite(elementLon) && element.tags?.name) {
          uniqueElements.set(`${element.type || "node"}:${element.id}`, element);
        }
      });

      const processed = [...uniqueElements.values()]
        .map((e) => {
          const name = e.tags.name || "Service Center";
          const latValue = e.lat ?? e.center.lat;
          const lonValue = e.lon ?? e.center.lon;
          const dist = haversine(lat, lon, latValue, lonValue);
          const brandText = [
            name,
            e.tags.brand,
            e.tags.operator,
            e.tags.network,
          ].filter(Boolean).join(" ");
          const authorized = brandMatchesText(brandText, brandProfile);
          const addrParts = [
            e.tags["addr:housenumber"],
            e.tags["addr:street"],
            e.tags["addr:suburb"],
            e.tags["addr:city"],
          ].filter(Boolean);

          return {
            id: `${e.type || "node"}:${e.id}`,
            name,
            address: addrParts.length
              ? addrParts.join(", ")
              : e.tags["addr:full"] || "Address not listed",
            phone:   e.tags.phone || e.tags["contact:phone"] || null,
            website: e.tags.website || e.tags["contact:website"] || null,
            hours:   e.tags.opening_hours || null,
            type:    authorized ? "authorized" : "local",
            dist:    parseFloat(dist.toFixed(1)),
            lat:     latValue,
            lon:     lonValue,
          };
        });

      const authorized = processed
        .filter((center) => center.type === "authorized")
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 10);
      const local = processed
        .filter((center) => center.type === "local")
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 20);

      setCenters([...authorized, ...local].sort((a, b) => a.dist - b.dist));
      setPhase("done");
    } catch {
      setErrMsg("Could not load results. Use the Google Maps button below.");
      setPhase("error");
    }
  }, [brandProfile]);

  useEffect(() => {
    if (previousBrand.current === brand) return;
    previousBrand.current = brand;
    setFilter("all");
    setExpanded(null);
    setErrMsg("");

    if (userLoc) {
      fetchCenters(userLoc.lat, userLoc.lon);
    } else {
      setCenters([]);
      setPhase("idle");
    }
  }, [brand, userLoc, fetchCenters]);

  const locate = () => {
    setPhase("locating");
    if (!navigator.geolocation) {
      setErrMsg("Geolocation is not supported by your browser.");
      setPhase("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLoc({ lat: coords.latitude, lon: coords.longitude });
        fetchCenters(coords.latitude, coords.longitude);
      },
      () => {
        setErrMsg("Location access denied. Please allow location in browser settings.");
        setPhase("error");
      },
      { timeout: 12000 }
    );
  };

  const openDirections = (c) =>
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`,
      "_blank"
    );

  const openGoogleFallback = () => {
    const q = brand
      ? `${brand} authorized service center near me`
      : "car service center near me";
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
      "_blank"
    );
  };

  const openViewAll = () => {
    if (!userLoc) return;
    const q = brand ? `${brand} authorized service center` : "car service center";
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(q)}/@${userLoc.lat},${userLoc.lon},14z`,
      "_blank"
    );
  };

  const filtered =
    filter === "all"
      ? centers
      : centers.filter((c) => c.type === filter);

  const authCount  = centers.filter((c) => c.type === "authorized").length;
  const localCount = centers.filter((c) => c.type === "local").length;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: CARD, border: `1px solid ${BORDER}` }}>

      {/* Header */}
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📍</span>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: TEXT }}>Nearby Service Centers</h2>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>
              {brand ? (
                <>Searching for <span style={{ color: PRIMARY }}>{brand}</span> authorized + local garages</>
              ) : (
                "Authorized centers appear after you select a vehicle"
              )}
            </p>
          </div>
        </div>
        {phase === "done" && (
          <button
            onClick={openViewAll}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ background: SURFACE, color: PRIMARY, border: `1px solid ${BORDER}` }}
          >
            View on Map ↗
          </button>
        )}
      </div>

      <div className="p-5">

        {/* IDLE — show two options */}
        {phase === "idle" && (
          <div className="space-y-4">
            <p className="text-sm text-center" style={{ color: MUTED }}>
              Which type of service center do you prefer?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              {/* Authorized */}
              <div className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: `${T.success}10`, border: `1px solid ${T.success}44` }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: TEXT }}>Authorized Centers</p>
                    <p className="text-xs" style={{ color: T.success }}>
                      {brand ? `${brand} Official Service` : "Select your vehicle first"}
                    </p>
                  </div>
                </div>
                {brand ? (
                  <ul className="space-y-1">
                    {[`Genuine ${brand} parts`, "Manufacturer-authorized service", "Warranty support"].map(t => (
                      <li key={t} className="text-xs flex gap-1.5" style={{ color: MUTED }}>
                        <span style={{ color: T.success }}>✓</span>{t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs" style={{ color: MUTED }}>
                    Choose your vehicle to find manufacturer-authorized service centers.
                  </p>
                )}
              </div>

              {/* Local */}
              <div className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: "#B4530910", border: "1px solid #B4530944" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: TEXT }}>Local Garages</p>
                    <p className="text-xs" style={{ color: "#B45309" }}>Independent mechanics</p>
                  </div>
                </div>
                <ul className="space-y-1">
                  {["Faster service", "More affordable", "Flexible repairs"].map(t => (
                    <li key={t} className="text-xs flex gap-1.5" style={{ color: MUTED }}>
                      <span style={{ color: "#B45309" }}>✓</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={locate}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ background: PRIMARY, color: ON_PRIMARY }}
            >
              📍 Find Both Near Me
            </button>
            <p className="text-xs text-center" style={{ color: T.faint }}>
              Location used only in your browser — never stored on servers
            </p>
          </div>
        )}

        {/* LOCATING */}
        {phase === "locating" && (
          <div className="text-center py-8 space-y-3">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: MUTED }}>Getting your location…</p>
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <div className="text-center py-8 space-y-3">
            <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin mx-auto"
              style={{ borderColor: PRIMARY, borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: MUTED }}>
              {brand
                ? `Searching for ${brand} authorized centers and local garages…`
                : "Searching nearby local garages…"}
            </p>
            <p className="text-xs" style={{ color: T.faint }}>This may take 10–15 seconds</p>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="text-center py-6 space-y-4">
            <p className="text-sm" style={{ color: T.danger }}>{errMsg}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={locate} className="px-4 py-2 rounded-xl text-sm"
                style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
                Try Again
              </button>
              <button onClick={openGoogleFallback} className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: PRIMARY, color: ON_PRIMARY }}>
                Open Google Maps ↗
              </button>
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === "done" && (
          <div className="space-y-4">

            {/* Search context */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl p-3" style={{ background: SURFACE }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: TEXT }}>Selected Vehicle</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {vehicleLabel || "No vehicle selected"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: TEXT }}>
                  {brand ? `${brand} Authorized Service Centers` : "Authorized Centers"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {brand ? "Manufacturer-authorized, within 30 km" : "Select your vehicle first"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: TEXT }}>Local Garages</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>Brand-independent, nearby</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Found", value: centers.length, color: PRIMARY },
                { label: "Authorized",  value: authCount,      color: T.success },
                { label: "Local",       value: localCount,     color: "#B45309" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3 text-center" style={{ background: SURFACE }}>
                  <p className="text-xl font-bold" style={{ color }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: MUTED }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              {[
                { key: "all",        label: `All (${centers.length})` },
                { key: "authorized", label: `✅ Authorized (${authCount})` },
                { key: "local",      label: `🔧 Local (${localCount})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filter === key ? PRIMARY : SURFACE,
                    color:      filter === key ? ON_PRIMARY : MUTED,
                    border:     `1px solid ${filter === key ? PRIMARY : BORDER}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* No results */}
            {filtered.length === 0 && (
              <div className="text-center py-8 space-y-3">
                <p style={{ color: MUTED }}>
                  {filter === "authorized"
                    ? brand
                      ? `No ${brand} authorized centers found nearby.`
                      : "Select your vehicle first to find brand-authorized centers."
                    : `No ${filter} centers found nearby.`}
                </p>
                <button onClick={openGoogleFallback} className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: PRIMARY, color: ON_PRIMARY }}>
                  Search on Google Maps ↗
                </button>
              </div>
            )}

            {/* Center cards */}
            <div className="space-y-3">
              <AnimatePresence>
                {filtered.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${c.type === "authorized" ? `${T.success}44` : BORDER}` }}
                  >
                    {/* Card header */}
                    <div
                      className="p-4 cursor-pointer flex items-start justify-between gap-3"
                      style={{ background: c.type === "authorized" ? `${T.success}08` : SURFACE }}
                      onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                          style={{ background: BG }}>
                          {c.type === "authorized" ? "🏢" : "🔧"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm truncate" style={{ color: TEXT }}>{c.name}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                background: c.type === "authorized" ? `${T.success}22` : "#B4530922",
                                color:      c.type === "authorized" ? T.success   : "#B45309",
                              }}>
                              {c.type === "authorized" ? "✅ Authorized" : "🔧 Local"}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>{c.address}</p>
                          {c.hours && <p className="text-xs mt-0.5" style={{ color: T.success }}>🕐 {c.hours}</p>}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm" style={{ color: PRIMARY }}>{c.dist} km</p>
                        <p className="text-xs" style={{ color: MUTED }}>away</p>
                      </div>
                    </div>

                    {/* Expanded actions */}
                    <AnimatePresence>
                      {expanded === c.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ background: BG, borderTop: `1px solid ${BORDER}` }}
                        >
                          <div className="p-4 space-y-3">
                            {c.type === "authorized" ? (
                              <div className="text-xs p-2.5 rounded-lg" style={{ background: `${T.success}15`, color: T.success }}>
                                ✅ {brand || "Brand"} authorized dealer — uses genuine {brand || "manufacturer"} parts, manufacturer warranty honored
                              </div>
                            ) : (
                              <div className="text-xs p-2.5 rounded-lg" style={{ background: "#B4530915", color: "#B45309" }}>
                                🔧 Local garage — typically faster turnaround, often more affordable
                              </div>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => openDirections(c)}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold min-w-[100px]"
                                style={{ background: PRIMARY, color: ON_PRIMARY }}
                              >
                                🗺️ Get Directions
                              </button>
                              {c.phone && (
                                <a
                                  href={`tel:${c.phone}`}
                                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center min-w-[80px]"
                                  style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}
                                >
                                  📞 Call
                                </a>
                              )}
                              {c.website && (
                                <a
                                  href={c.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-center min-w-[80px]"
                                  style={{ background: SURFACE, color: PRIMARY, border: `1px solid ${BORDER}` }}
                                >
                                  🌐 Website
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={locate} className="flex-1 py-2.5 rounded-xl text-xs"
                style={{ background: SURFACE, color: MUTED, border: `1px solid ${BORDER}` }}>
                🔄 Refresh
              </button>
              <button onClick={openGoogleFallback} className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                style={{ background: SURFACE, color: PRIMARY, border: `1px solid ${BORDER}` }}>
                Google Maps ↗
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
