/**
 * useAuthStore.ts
 * Zustand store cho JWT authentication state.
 * - Token lưu trong sessionStorage (clear khi đóng tab)
 * - Tự động restore khi refresh trang
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
}

const TOKEN_KEY = 'bnm-auth-token';
const USER_KEY = 'bnm-auth-user';

export const useAuthStore = create<AuthState>((set, get) => ({
  // Restore từ sessionStorage khi store khởi tạo
  token: sessionStorage.getItem(TOKEN_KEY),
  user: (() => {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  })(),

  get isAuthenticated() {
    return !!get().token;
  },

  hasRole: (role) => {
    const user = get().user;
    if (!user || Array.isArray(user.roles) === false) return false;
    if (Array.isArray(role)) {
      return user.roles.some((r) => role.includes(r as any));
    }
    return user.roles.includes(role as any);
  },

  login: async (email, password) => {
    const { accessToken, user } = await internalApi.login(email, password);
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token: accessToken, user });
  },

  logout: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },

  restoreFromSession: () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      const user = raw ? (JSON.parse(raw) as AuthUser) : null;
      set({ token, user });
    } catch {
      set({ token: null, user: null });
    }
  },
}));
