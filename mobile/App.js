import React from "react";
import { StatusBar } from "expo-status-bar";
import { VehicleProvider } from "./src/context/VehicleContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <VehicleProvider>
      <StatusBar style="light" backgroundColor="#0f172a" />
      <AppNavigator />
    </VehicleProvider>
  );
}
