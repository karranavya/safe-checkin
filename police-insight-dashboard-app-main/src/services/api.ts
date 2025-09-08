// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getAuthToken = () => {
  return (
    localStorage.getItem("policeToken") || sessionStorage.getItem("policeToken")
  );
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};

export const activityAPI = {
  getLogs: (params: URLSearchParams) =>
    apiRequest(`/api/activities/logs?${params}`),
  getMyActivities: () => apiRequest("/api/activities/my-activities"),
  getStats: () => apiRequest("/api/activities/stats"),
};

export const alertAPI = {
  getAll: (params: URLSearchParams) =>
    apiRequest(`/api/police/alerts?${params}`),
  updateStatus: (id: string, status: string, notes?: string) =>
    apiRequest(`/api/police/alerts/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, notes }),
    }),
};

export const reportAPI = {
  generateCustom: (data: any) =>
    apiRequest("/api/reports/custom", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getHotelStats: (params: URLSearchParams) =>
    apiRequest(`/api/reports/hotels-stats?${params}`),
  getAreaStats: (params: URLSearchParams) =>
    apiRequest(`/api/reports/area-stats?${params}`),
};
