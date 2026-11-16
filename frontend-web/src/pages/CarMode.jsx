import React from "react";
import { useNavigate } from "react-router-dom";
import { useVehicle } from "../context/VehicleContext";
import CarDashboard from "../components/CarDisplay/CarDashboard";

export default function CarMode() {
  const { report } = useVehicle();
  const navigate   = useNavigate();

  return (
    <CarDashboard report={report} onExit={() => navigate("/diagnostics")} />
  );
}
