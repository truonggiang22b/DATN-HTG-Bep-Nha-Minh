/**
 * useGuestInfo.ts — Zustand store with localStorage persistence
 * Phase 2: Lưu thông tin khách hàng cho lần sau (guest checkout)
 *
 * Sử dụng zustand/middleware persist để tự động đồng bộ localStorage.
 * Không cần đăng ký tài khoản — thông tin được nhớ trên trình duyệt.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GuestInfo {
  customerName: string;
  phone: string;
  address: string;
  ward: string;
  district: string;
  note: string;
}

interface GuestInfoState {
  guestInfo: GuestInfo;
  setGuestInfo: (info: Partial<GuestInfo>) => void;
  clearGuestInfo: () => void;
  isInfoComplete: () => boolean;
}

const DEFAULT_INFO: GuestInfo = {
  customerName: '',
  phone: '',
  address: '',
  ward: '',
  district: '',
  note: '',
};

export const useGuestInfo = create<GuestInfoState>()(
  persist(
    (set, get) => ({
      guestInfo: DEFAULT_INFO,

      setGuestInfo: (info) =>
        set((state) => ({
          guestInfo: { ...state.guestInfo, ...info },
        })),

      clearGuestInfo: () => set({ guestInfo: DEFAULT_INFO }),

      isInfoComplete: () => {
        const { guestInfo } = get();
        return (
          guestInfo.customerName.trim().length >= 2 &&
          /^(0[3-9]\d{8})$/.test(guestInfo.phone) &&
          guestInfo.address.trim().length >= 5
        );
      },
    }),
    {
      name: 'bnm-guest-info', // localStorage key
      version: 1,
    }
  )
);
