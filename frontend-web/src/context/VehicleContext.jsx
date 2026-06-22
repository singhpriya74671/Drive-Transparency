import React, { createContext, useContext, useState, useCallback } from "react";
import { vehicleAPI, maintenanceAPI } from "../services/api";
import toast from "react-hot-toast";

const VehicleContext = createContext(null);

export function VehicleProvider({ children }) {
  const [vehicles, setVehicles]        = useState([]);
  const [selectedVehicle, setSelected] = useState(null);
  const [report, setReport]            = useState(null);
  const [loading, setLoading]          = useState(false);

  const loadVehicles = useCallback(async () => {
    try {
      const { data } = await vehicleAPI.list();
      setVehicles(data);
    } catch {
      toast.error("Failed to load vehicles.");
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

  const analyzeVehicle = useCallback(async (vehicleId) => {
    setLoading(true);
    try {
      const { data } = await maintenanceAPI.analyze(vehicleId);
      setReport(data);
      return data;
    } catch {
      toast.error("Analysis failed. Please try again.");
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
      toast.error("Quick analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <VehicleContext.Provider
      value={{
        vehicles, selectedVehicle, setSelected,
        report, setReport,
        loading,
        loadVehicles, createVehicle,
        analyzeVehicle, analyzeQuick,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
}

export const useVehicle = () => useContext(VehicleContext);
