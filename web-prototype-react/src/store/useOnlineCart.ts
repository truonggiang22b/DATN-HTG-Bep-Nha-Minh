/**
 * useOnlineCart.ts — Zustand store for online ordering cart
 * Phase 2: Cart riêng biệt cho Online Ordering (không ảnh hưởng QR cart)
 *
 * Persist vào localStorage để giỏ hàng không mất khi reload.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedOption {
  optionGroupId?: string;
  optionId: string;
  name: string;
  priceDelta: number;
}

export interface OnlineCartItem {
  id: string; // unique cart item id (menuItemId + options hash)
  menuItemId: string;
  name: string;
  imageUrl?: string;
  basePrice: number;
  quantity: number;
  selectedOptions: SelectedOption[];
  note: string;
  unitPrice: number; // basePrice + sum(priceDelta)
  lineTotal: number; // unitPrice × quantity
}

interface OnlineCartState {
  branchId: string;
  items: OnlineCartItem[];
  addItem: (item: Omit<OnlineCartItem, 'id' | 'lineTotal'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateNote: (id: string, note: string) => void;
  clearCart: () => void;
  setBranchId: (id: string) => void;
  getSubtotal: () => number;
  getTotalItems: () => number;
}

// Generate deterministic ID from menuItemId + options
function cartItemId(menuItemId: string, options: SelectedOption[]): string {
  const optKey = options.map((o) => o.optionId).sort().join('|');
  return `${menuItemId}__${optKey}`;
}

const DEFAULT_BRANCH_ID = 'branch-bep-nha-minh-q1'; // hardcoded MVP

export const useOnlineCart = create<OnlineCartState>()(
  persist(
    (set, get) => ({
      branchId: DEFAULT_BRANCH_ID,
      items: [],

      setBranchId: (id) => set({ branchId: id }),

      addItem: (item) => {
        const id = cartItemId(item.menuItemId, item.selectedOptions);
        const lineTotal = item.unitPrice * item.quantity;

        set((state) => {
          const existing = state.items.find((i) => i.id === id);
          if (existing) {
            // Same item + same options → increment quantity
            return {
              items: state.items.map((i) =>
                i.id === id
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      lineTotal: (i.quantity + item.quantity) * i.unitPrice,
                    }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, id, lineTotal }],
          };
        });
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id
              ? { ...i, quantity, lineTotal: quantity * i.unitPrice }
              : i
          ),
        }));
      },

      updateNote: (id, note) =>
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, note } : i)),
        })),

      clearCart: () => set({ items: [] }),

      getSubtotal: () =>
        get().items.reduce((sum, i) => sum + i.lineTotal, 0),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'bnm-online-cart', // separate localStorage key from QR cart
      version: 1,
    }
  )
);
