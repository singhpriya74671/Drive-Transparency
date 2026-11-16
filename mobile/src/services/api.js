import axios from "axios";

// Deployed backend, so the app works on real phones (Expo Go) out of the box.
// For a local backend on the Android emulator use "http://10.0.2.2:8000";
// on a physical device use "http://<your-PC-LAN-IP>:8000".
const BASE_URL = "https://drive-transparency.onrender.com";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  // Render's free tier can take ~50s to wake from sleep on the first request.
  timeout: 60000,
});

export const vehicleAPI = {
  create:  (data) => api.post("/api/vehicles/", data),
  list:    ()     => api.get("/api/vehicles/"),
  get:     (id)   => api.get(`/api/vehicles/${id}`),
};

export const maintenanceAPI = {
  analyzeQuick: (data)      => api.post("/api/maintenance/analyze-quick", data),
  analyze:      (vehicleId) => api.get(`/api/maintenance/analyze/${vehicleId}`),
  getHistory:   (vehicleId) => api.get(`/api/maintenance/history/${vehicleId}`),
};

export default api;
