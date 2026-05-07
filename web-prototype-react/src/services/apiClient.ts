/**
 * apiClient.ts
 * Axios instance dùng chung cho mọi API call.
 * - baseURL lấy từ env VITE_API_URL, fallback localhost:3001
 * - Request interceptor: tự động đính Bearer token từ localStorage
 * - Response interceptor: normalize error shape + auto-refresh khi 401
 */
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request: đính token ────────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('bnm-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response: normalize errors + auto-refresh on 401 ─────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (!originalRequest) {
      return Promise.reject(err);
    }
    const requestUrl = originalRequest.url ?? '';
    const isAuthRoute =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout');

    // Đính server error code vào error object
    const serverError = err.response?.data?.error;
    if (serverError) {
      err.code    = serverError.code;
      err.details = serverError.details;
    }

    // Auto-refresh khi 401 — chỉ retry 1 lần (tránh vòng lặp)
    if (err.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      const refreshToken = localStorage.getItem('bnm-refresh-token');

      // Không có refresh token → đăng xuất ngay
      if (!refreshToken) {
        localStorage.removeItem('bnm-auth-token');
        localStorage.removeItem('bnm-refresh-token');
        localStorage.removeItem('bnm-auth-user');
        window.location.href = '/login';
        return Promise.reject(err);
      }

      // Đang refresh → đưa request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi refresh endpoint (không cần Bearer header)
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/auth/refresh`,
          { refreshToken }
        );
        const { accessToken: newAccess, refreshToken: newRefresh } = res.data.data;

        // Cập nhật localStorage
        localStorage.setItem('bnm-auth-token', newAccess);
        localStorage.setItem('bnm-refresh-token', newRefresh);

        // Cập nhật header và xử lý queue
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
        processQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Refresh thất bại → clear session + redirect login
        localStorage.removeItem('bnm-auth-token');
        localStorage.removeItem('bnm-refresh-token');
        localStorage.removeItem('bnm-auth-user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);
