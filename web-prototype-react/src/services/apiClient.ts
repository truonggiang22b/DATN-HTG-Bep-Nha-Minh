/**
 * apiClient.ts
 * Axios instance dùng chung cho mọi API call.
 * - baseURL lấy từ env VITE_API_URL, fallback localhost:3001
 * - Request interceptor: tự động đính Bearer token từ sessionStorage
 * - Response interceptor: normalize error shape
 */
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request: đính token ────────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('bnm-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: normalize errors ────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // Đính thêm error code từ server vào error object để caller dễ xử lý
    const serverError = err.response?.data?.error;
    if (serverError) {
      err.code = serverError.code;
      err.details = serverError.details;
    }
    return Promise.reject(err);
  }
);
