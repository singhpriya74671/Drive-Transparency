import React, { createContext, useContext, useState, useCallback } from "react";
import { maintenanceAPI, vehicleAPI } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const VehicleContext = createContext(null);

export function VehicleProvider({ children }) {
  const [report, setReport]   = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const analyzeQuick = useCallback(async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await maintenanceAPI.analyzeQuick(formData);
      setReport(data);
      await AsyncStorage.setItem("lastReport", JSON.stringify(data));
      return data;
    } catch (err) {
      setError("Analysis failed. Please check your internet connection.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCachedReport = useCallback(async () => {
    try {
      const cached = await AsyncStorage.getItem("lastReport");
      if (cached) setReport(JSON.parse(cached));
    } catch {}
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const { data } = await vehicleAPI.list();
      setVehicles(data);
    } catch {}
  }, []);

  return (
    <VehicleContext.Provider value={{ report, setReport, vehicles, loading, error, analyzeQuick, loadCachedReport, loadVehicles }}>
      {children}
    </VehicleContext.Provider>
  );
}

export const useVehicle = () => useContext(VehicleContext);
