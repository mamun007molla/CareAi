// src/lib/api.js
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({ baseURL: API_URL, headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login:    (data) => api.post("/auth/login", data),
  me:       ()     => api.get("/auth/me"),
};

export const physicalAPI = {
  // Activity Log
  getActivities: ()       => api.get("/physical/activities"),
  logActivity:   (data)   => api.post("/physical/activities", data),
  deleteActivity:(id)     => api.delete(`/physical/activities/${id}`),
  getStats:      ()       => api.get("/physical/activities/stats"),

  // Routine Schedule
  getRoutines:   ()       => api.get("/physical/routines"),
  createRoutine: (data)   => api.post("/physical/routines", data),
  updateRoutine: (id, d)  => api.put(`/physical/routines/${id}`, d),
  deleteRoutine: (id)     => api.delete(`/physical/routines/${id}`),

  // Medication Verify (AI)
  verifyMedication: (fd)  => api.post("/physical/verify-medication", fd, { headers: { "Content-Type": "multipart/form-data" } }),
  getVerifyHistory: ()    => api.get("/physical/verify-medication/history"),
};
