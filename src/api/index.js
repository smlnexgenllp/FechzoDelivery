// src/api/index.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  // Do NOT set default Content-Type here — let the browser decide based on data type
});

// Add Authorization token interceptor (this part is fine)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("partnerToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Optional: safeguard — remove any accidental Content-Type for FormData requests
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;