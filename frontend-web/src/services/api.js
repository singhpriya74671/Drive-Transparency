import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  try {
    const user = JSON.parse(localStorage.getItem("dt_user"));
    if (user?.access_token) {
      config.headers.Authorization = `Bearer ${user.access_token}`;
    }
  } catch {}
  return config;
});

export const vehicleAPI = {
  create:  (data)         => api.post("/api/vehicles/", data),
  list:    ()             => api.get("/api/vehicles/"),
  get:     (id)           => api.get(`/api/vehicles/${id}`),
  update:  (id, data)     => api.put(`/api/vehicles/${id}`, data),
  delete:  (id)           => api.delete(`/api/vehicles/${id}`),
};

export const maintenanceAPI = {
  analyze:      (vehicleId, config) => api.get(`/api/maintenance/analyze/${vehicleId}`, config),
  analyzeQuick: (data)       => api.post("/api/maintenance/analyze-quick", data),
  getHistory:   (vehicleId)  => api.get(`/api/maintenance/history/${vehicleId}`),
  addRecord:    (data)       => api.post("/api/maintenance/history", data),
  markComplete: (recordId)   => api.put(`/api/maintenance/history/${recordId}/complete`),
};

export default api;
