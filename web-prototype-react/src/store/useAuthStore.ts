/**
 * useAuthStore.ts
 * Zustand store cho JWT authentication state.
 * - Token lưu trong localStorage (persist xuyên tab, xuyên lần đóng/mở browser)
 * - Logout mới xóa session
 */
import { create } from 'zustand';
import type { AuthUser, UserRole } from '../types';
import * as internalApi from '../services/internalApi';

interface AuthState {
  token: string | null;
  user: AuthUser | null;

  // Derived
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreFromSession: () => void;
  setToken: (accessToken: string, refreshToken: string) => void; // dùng cho auto-refresh
}

const TOKEN_KEY   = 'bnm-auth-token';
const REFRESH_KEY = 'bnm-refresh-token';  // ← mới
const USER_KEY    = 'bnm-auth-user';

/** Đọc user từ localStorage — trả null nếu lỗi */
function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Restore từ localStorage ngay khi store khởi tạo
  token: localStorage.getItem(TOKEN_KEY),
  user:  readUser(),

  get isAuthenticated() {
    return !!get().token;
  },

  hasRole: (role) => {
    const user = get().user;
    if (!user || !Array.isArray(user.roles)) return false;
    if (Array.isArray(role)) {
      return user.roles.some((r) => role.includes(r as any));
    }
    return user.roles.includes(role as any);
  },

  login: async (email, password) => {
    const { accessToken, refreshToken, user } = await internalApi.login(email, password);
    // Lưu cả access và refresh token vào localStorage
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);   // ← lưu refresh token
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token: accessToken, user });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);   // ← xóa refresh token
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },

  restoreFromSession: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    const user  = readUser();
    set({ token, user });
  },

  /** Được gọi bởi apiClient interceptor sau khi refresh thành công */
  setToken: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    set({ token: accessToken });
  },
}));

// Export key constants để apiClient interceptor dùng được mà không import store
export const AUTH_STORAGE_KEYS = {
  token:   TOKEN_KEY,
  refresh: REFRESH_KEY,
} as const;


