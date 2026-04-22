import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://elder-health-monitoring-system-server-production.up.railway.app/api/v1";
const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

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
  },
);

export default api;

// Auth
export const authAPI = {
  register: (d) => api.post("/auth/register", d),
  login: (d) => api.post("/auth/login", d),
  me: () => api.get("/auth/me"),
};

// Module 1 - Physical
export const physicalAPI = {
  getActivities: () => api.get("/physical/activities"),
  logActivity: (d) => api.post("/physical/activities", d),
  deleteActivity: (id) => api.delete(`/physical/activities/${id}`),
  getStats: () => api.get("/physical/activities/stats"),
  getRoutines: () => api.get("/physical/routines"),
  createRoutine: (d) => api.post("/physical/routines", d),
  updateRoutine: (id, d) => api.put(`/physical/routines/${id}`, d),
  deleteRoutine: (id) => api.delete(`/physical/routines/${id}`),
  verifyMedication: (fd) =>
    api.post("/physical/verify-medication", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getVerifyHistory: () => api.get("/physical/verify-medication/history"),
  analyzeImage: (fd) =>
    api.post("/physical/analyze-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  detectFall: (fd) =>
    api.post("/physical/detect-fall", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300000,
    }),
};

// Module 2 - Health
export const medicationAPI = {
  getAll: () => api.get("/health/medications"),
  create: (d) => api.post("/health/medications", d),
  remove: (id) => api.delete(`/health/medications/${id}`),
  getStats: () => api.get("/health/medications/stats"),
};

export const healthRecordAPI = {
  getAll: () => api.get("/health/records"),
  create: (d) => api.post("/health/records", d),
  remove: (id) => api.delete(`/health/records/${id}`),
};

export const prescriptionAPI = {
  getAll: () => api.get("/health/prescriptions"),
  upload: (fd) =>
    api.post("/health/prescriptions/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  remove: (id) => api.delete(`/health/prescriptions/${id}`),
  summarize: (id) => api.post(`/health/prescriptions/${id}/summarize`),
  summarizeText: (fd) =>
    api.post("/health/reports/summarize-text", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const nutritionAPI = {
  getMeals: () => api.get("/health/meals"),
  logMeal: (d) => api.post("/health/meals", d),
  removeMeal: (id) => api.delete(`/health/meals/${id}`),
  todayStats: () => api.get("/health/meals/today-stats"),
  analyzeFood: (fd) =>
    api.post("/health/meals/analyze-image", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// Module 3 - Mental Health
export const mentalAPI = {
  getMoods: (limit) => api.get(`/mental/mood?limit=${limit || 20}`),
  analyzeMood: (fd) =>
    api.post("/mental/mood/analyze", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  weeklySummary: () => api.get("/mental/mood/weekly-summary"),
  vqa: (fd) =>
    api.post("/mental/vqa", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  diagnostic: (fd) =>
    api.post("/mental/diagnostic", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  summarizeReport: (fd) =>
    api.post("/mental/summarize-report", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getChecklist: () => api.get("/mental/checklist"),
  addChecklist: (fd) =>
    api.post("/mental/checklist", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  toggleChecklist: (id) => api.patch(`/mental/checklist/${id}/toggle`),
  deleteChecklist: (id) => api.delete(`/mental/checklist/${id}`),
  checklistStats: () => api.get("/mental/checklist/stats"),
};

// Notifications & SOS
export const notificationAPI = {
  getAll: () => api.get("/notifications"),
  unreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
  triggerSOS: (msg, loc) =>
    api.post("/notifications/sos", null, {
      params: { message: msg, location: loc },
    }),
  getSOSAlerts: () => api.get("/notifications/sos-alerts"),
  resolveSOSAlert: (id) => api.patch(`/notifications/sos/${id}/resolve`),
};

// Links
export const linksAPI = {
  linkByEmail: (email, relation) =>
    api.post("/links/link-by-email", null, { params: { email, relation } }),
  getMyPatients: () => api.get("/links/my-patients"),
  getMyCaregivers: () => api.get("/links/my-caregivers"),
  unlink: (id) => api.delete(`/links/unlink/${id}`),
};

// Caregiver Tools
export const caregiverAPI = {
  logActivity: (patientId, d) =>
    api.post(`/caregiver/log-activity/${patientId}`, d),
  logMeal: (patientId, d) => api.post(`/caregiver/log-meal/${patientId}`, d),
  addNote: (patientId, note) =>
    api.post(`/caregiver/add-note/${patientId}`, null, { params: { note } }),
  triggerSOS: (patientId, msg) =>
    api.post(`/caregiver/sos/${patientId}`, null, { params: { message: msg } }),
  getOverview: (patientId) =>
    api.get(`/caregiver/patient-overview/${patientId}`),
};

// Communication
export const communicationAPI = {
  getContacts: () => api.get("/communication/contacts"),
  getMessages: (userId) => api.get(`/communication/messages/${userId}`),
  sendMessage: (d) => api.post("/communication/messages", d),
  getAppointments: () => api.get("/communication/appointments"),
  createAppt: (d) => api.post("/communication/appointments", d),
  updateApptStatus: (id, status) =>
    api.patch(`/communication/appointments/${id}/status`, null, {
      params: { status },
    }),
  deleteAppt: (id) => api.delete(`/communication/appointments/${id}`),
  getEmergencyContacts: () => api.get("/communication/emergency-contacts"),
  addEmergencyContact: (d) => api.post("/communication/emergency-contacts", d),
  deleteEmergencyContact: (id) =>
    api.delete(`/communication/emergency-contacts/${id}`),
};
