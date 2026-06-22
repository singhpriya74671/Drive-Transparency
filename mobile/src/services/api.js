import axios from "axios";

// Change this to your server IP when testing on a physical device
const BASE_URL = "http://10.0.2.2:8000"; // Android emulator → host machine

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
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
