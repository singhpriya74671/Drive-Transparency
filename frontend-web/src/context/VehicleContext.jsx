import React, { createContext, useContext, useState, useCallback } from "react";
import { vehicleAPI, maintenanceAPI } from "../services/api";
import { buildVehicleFromInput } from "../data/vehicleCatalog";
import { buildLocalReport } from "../utils/localVehicleReport";
import toast from "react-hot-toast";

const VehicleContext = createContext(null);

const STORAGE_KEY = "dt_manual_vehicle";

function readStoredInput() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function persistInput(value) {
  if (typeof window === "undefined") return;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable (private mode); the in-memory state still works.
  }
}

export function VehicleProvider({ children }) {
  const [bootstrap] = useState(() => {
    const text = readStoredInput();
    const vehicle = text ? buildVehicleFromInput(text) : null;
    return { text, vehicle };
  });

  const [vehicles, setVehicles]        = useState([]);
  const [selectedVehicle, setSelected] = useState(bootstrap.vehicle);
  const [report, setReport]            = useState(
    bootstrap.vehicle ? buildLocalReport(bootstrap.vehicle) : null
  );
  const [manualInput, setManualInput]  = useState(bootstrap.text);
  const [loading, setLoading]          = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const { data } = await vehicleAPI.list();
      setVehicles(data);
    } catch {
      // Backend may be offline; manual input and local diagnostics still work.
    }
  }, []);

  const createVehicle = useCallback(async (formData) => {
    setLoading(true);
    try {
      const { data } = await vehicleAPI.create(formData);
      setVehicles((prev) => [data, ...prev]);
      toast.success("Vehicle saved successfully!");
      return data;
    } catch (err) {
      toast.error("Could not save vehicle. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeVehicle = useCallback(async (vehicleId, config) => {
    setLoading(true);
    try {
      const { data } = await maintenanceAPI.analyze(vehicleId, config);
      setReport(data);
      return data;
    } catch (err) {
      const cancelled = err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
      if (!cancelled) toast.error("Analysis failed. Showing local diagnostics instead.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeQuick = useCallback(async (formData) => {
    setLoading(true);
    try {
      const { data } = await maintenanceAPI.analyzeQuick(formData);
      setReport(data);
      return data;
    } catch {
      const local = buildLocalReport(formData);
      setReport(local);
      return local;
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual model entry is the single source of truth: it resolves brand, model,
  // body type, specs and a fresh diagnostic report immediately.
  const applyVehicleInput = useCallback((text) => {
    const vehicle = buildVehicleFromInput(text);
    if (!vehicle) {
      setManualInput("");
      persistInput("");
      return null;
    }
    setManualInput(vehicle._input);
    setSelected(vehicle);
    setReport(buildLocalReport(vehicle));
    persistInput(vehicle._input);
    return vehicle;
  }, []);

  // Selecting a saved vehicle also seeds a local report so the UI never waits
  // on the backend before updating.
  const selectVehicle = useCallback((vehicle) => {
    if (!vehicle) {
      setSelected(null);
      setReport(null);
      return;
    }
    setSelected(vehicle);
    setReport(buildLocalReport(vehicle));
  }, []);

  const clearVehicle = useCallback(() => {
    setSelected(null);
    setReport(null);
    setManualInput("");
    persistInput("");
  }, []);

  return (
    <VehicleContext.Provider
      value={{
        vehicles, selectedVehicle, setSelected,
        report, setReport,
        manualInput,
        loading,
        loadVehicles, createVehicle,
        analyzeVehicle, analyzeQuick,
        applyVehicleInput, selectVehicle, clearVehicle,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export const useVehicle = () => useContext(VehicleContext);
