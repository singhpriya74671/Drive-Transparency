import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVehicle } from "../context/VehicleContext";

const CARD    = "#272727";
const SURFACE = "#323232";
const PRIMARY = "#DDD0C8";
const TEXT    = "#F0EBE5";
const MUTED   = "#8C8480";
const BORDER  = "#3D3D3D";
const BG      = "#1C1C1C";

const KNOWN_BRANDS = [
  "maruti", "suzuki", "hyundai", "tata", "honda", "toyota", "ford",
  "volkswagen", "vw", "kia", "mg", "mahindra", "renault", "nissan",
  "skoda", "jeep", "bmw", "mercedes", "audi", "volvo", "fiat",
  "chevrolet", "mitsubishi", "isuzu", "datsun",
];

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

function detectBrand(vehicle) {
  if (!vehicle) return null;
  const text = `${vehicle.manufacturer || ""} ${vehicle.vehicle_model || ""}`.toLowerCase();
  return KNOWN_BRANDS.find((b) => text.includes(b)) || null;
}

function isAuthorizedCenter(name, brand) {
  const n = name.toLowerCase();
  if (!brand) return false;
  return (
    n.includes(brand) ||
    n.includes("authorized") ||
    n.includes("authorised") ||
    n.includes("official") ||
    n.includes("genuine") ||
    n.includes("dealership") ||
    n.includes("dealer")
  );
}

export default function NearbyServiceCenters() {
  const { selectedVehicle } = useVehicle();
  const [phase, setPhase]       = useState("idle"); // idle|locating|loading|done|error
  const [centers, setCenters]   = useState([]);
  const [userLoc, setUserLoc]   = useState(null);
  const [filter, setFilter]     = useState("all");
  const [errMsg, setErrMsg]     = useState("");
  const [expanded, setExpanded] = useState(null);

  const brand = detectBrand(selectedVehicle);

  const fetchCenters = useCallback(async (lat, lon) => {
    setPhase("loading");
    try {
      const query = `
[out:json][timeout:30];
(
  node["amenity"="car_repair"](around:6000,${lat},${lon});
  node["shop"="car_repair"](around:6000,${lat},${lon});
  node["amenity"="car_service"](around:6000,${lat},${lon});
  node["shop"="vehicle"](around:6000,${lat},${lon});
);
out body;`;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });
      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const elements = (data.elements || []).filter(
        (e) => e.lat && e.lon && e.tags?.name
      );

      const processed = elements
        .map((e) => {
          const name = e.tags.name || "Service Center";
          const dist = haversine(lat, lon, e.lat, e.lon);
          const authorized = isAuthorizedCenter(name, brand);
          const addrParts = [
            e.tags["addr:housenumber"],
            e.tags["addr:street"],
            e.tags["addr:suburb"],
            e.tags["addr:city"],
          ].filter(Boolean);

          return {
            id: e.id,
            name,
            address: addrParts.length
              ? addrParts.join(", ")
              : e.tags["addr:full"] || "Address not listed",
            phone:   e.tags.phone || e.tags["contact:phone"] || null,
            website: e.tags.website || e.tags["contact:website"] || null,
            hours:   e.tags.opening_hours || null,
            type:    authorized ? "authorized" : "local",
            dist:    parseFloat(dist.toFixed(1)),
            lat:     e.lat,
            lon:     e.lon,
          };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 20);

      setCenters(processed);
      setPhase("done");
    } catch {
      setErrMsg("Could not load results. Use the Google Maps button below.");
      setPhase("error");
    }
  }, [brand]);

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
      ? `${brand} service center near me`
      : "car service center near me";
    window.open(
      `https://www.google.com/maps/search/${encodeURIComponent(q)}`,
      "_blank"
    );
  };

  const openViewAll = () => {
    if (!userLoc) return;
    const q = brand ? `${brand} service center` : "car service center";
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
            {brand && (
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                Searching for <span style={{ color: PRIMARY, textTransform: "capitalize" }}>{brand}</span> authorized + local garages
              </p>
            )}
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

        {/* IDLE — show locate button */}
        {phase === "idle" && (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: SURFACE }}>📍</div>
            <div>
              <p className="font-semibold mb-1" style={{ color: TEXT }}>Find Service Centers Near You</p>
              <p className="text-sm" style={{ color: MUTED }}>
                We'll use your GPS to find real authorized and local garages nearby.
              </p>
            </div>
            <button
              onClick={locate}
              className="px-6 py-3 rounded-xl font-semibold text-sm mx-auto block"
              style={{ background: PRIMARY, color: BG }}
            >
              📍 Use My Location
            </button>
            <p className="text-xs" style={{ color: "#555" }}>Location is used only in your browser — never sent to our servers</p>
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
            <p className="text-sm" style={{ color: MUTED }}>Searching nearby service centers…</p>
            <p className="text-xs" style={{ color: "#555" }}>This may take 10–15 seconds</p>
          </div>
        )}

        {/* ERROR */}
        {phase === "error" && (
          <div className="text-center py-6 space-y-4">
            <p className="text-sm" style={{ color: "#CF5C5C" }}>{errMsg}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={locate} className="px-4 py-2 rounded-xl text-sm"
                style={{ background: SURFACE, color: TEXT, border: `1px solid ${BORDER}` }}>
                Try Again
              </button>
              <button onClick={openGoogleFallback} className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: PRIMARY, color: BG }}>
                Open Google Maps ↗
              </button>
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === "done" && (
          <div className="space-y-4">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Found", value: centers.length, color: PRIMARY },
                { label: "Authorized",  value: authCount,      color: "#4CAF7D" },
                { label: "Local",       value: localCount,     color: "#D4935E" },
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
                    color:      filter === key ? BG      : MUTED,
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
                <p style={{ color: MUTED }}>No {filter} centers found nearby.</p>
                <button onClick={openGoogleFallback} className="px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: PRIMARY, color: BG }}>
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
                    style={{ border: `1px solid ${c.type === "authorized" ? "#4CAF7D44" : BORDER}` }}
                  >
                    {/* Card header */}
                    <div
                      className="p-4 cursor-pointer flex items-start justify-between gap-3"
                      style={{ background: c.type === "authorized" ? "#4CAF7D08" : SURFACE }}
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
                                background: c.type === "authorized" ? "#4CAF7D22" : "#D4935E22",
                                color:      c.type === "authorized" ? "#4CAF7D"   : "#D4935E",
                              }}>
                              {c.type === "authorized" ? "✅ Authorized" : "🔧 Local"}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>{c.address}</p>
                          {c.hours && <p className="text-xs mt-0.5" style={{ color: "#4CAF7D" }}>🕐 {c.hours}</p>}
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
                              <div className="text-xs p-2.5 rounded-lg" style={{ background: "#4CAF7D15", color: "#4CAF7D" }}>
                                ✅ Authorized dealer — uses genuine parts, manufacturer warranty honored
                              </div>
                            ) : (
                              <div className="text-xs p-2.5 rounded-lg" style={{ background: "#D4935E15", color: "#D4935E" }}>
                                🔧 Local garage — typically faster turnaround, often more affordable
                              </div>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => openDirections(c)}
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold min-w-[100px]"
                                style={{ background: PRIMARY, color: BG }}
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
