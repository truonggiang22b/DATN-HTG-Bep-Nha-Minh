/**
 * useStore.ts — Stripped version (Sprint 4)
 * Zustand store chỉ còn Toast notifications.
 * Toàn bộ data (menu, orders, tables, sessions) đã chuyển sang React Query + API.
 * Cart vẫn ở useClientSession.ts (sessionStorage).
 */
import { create } from 'zustand';
import type { Toast } from '../types';

const uuid = () => crypto.randomUUID();

interface StoreState {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}

export const useStore = create<StoreState>()((set) => ({
  toasts: [],

  showToast: (message, type = 'success') => {
    const id = uuid();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },

  dismissToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
