import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const vehicleAPI = {
  create:  (data)         => api.post("/api/vehicles/", data),
  list:    ()             => api.get("/api/vehicles/"),
  get:     (id)           => api.get(`/api/vehicles/${id}`),
  update:  (id, data)     => api.put(`/api/vehicles/${id}`, data),
  delete:  (id)           => api.delete(`/api/vehicles/${id}`),
};

export const maintenanceAPI = {
  analyze:      (vehicleId)  => api.get(`/api/maintenance/analyze/${vehicleId}`),
  analyzeQuick: (data)       => api.post("/api/maintenance/analyze-quick", data),
  getHistory:   (vehicleId)  => api.get(`/api/maintenance/history/${vehicleId}`),
  addRecord:    (data)       => api.post("/api/maintenance/history", data),
  markComplete: (recordId)   => api.put(`/api/maintenance/history/${recordId}/complete`),
};

export default api;
