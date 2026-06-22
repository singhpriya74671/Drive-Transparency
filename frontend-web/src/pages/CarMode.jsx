import React from "react";
import { useNavigate } from "react-router-dom";
import { useVehicle } from "../context/VehicleContext";
import CarDashboard from "../components/CarDisplay/CarDashboard";

export default function CarMode() {
  const { report } = useVehicle();
  const navigate   = useNavigate();

  return (
    <div className="relative min-h-screen" style={{ background: "#1C1C1C" }}>
      <CarDashboard report={report} />
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          position:     "fixed",
          bottom:       20,
          right:        20,
          background:   "#272727",
          color:        "#F0EBE5",
          border:       "1px solid #3D3D3D",
          borderRadius: 12,
          padding:      "12px 20px",
          fontSize:     14,
          fontWeight:   600,
          cursor:       "pointer",
          zIndex:       50,
        }}
      >
        ✕ Exit Car Mode
      </button>
    </div>
  );
}
