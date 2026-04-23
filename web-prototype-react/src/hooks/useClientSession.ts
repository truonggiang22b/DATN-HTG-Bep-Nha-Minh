import { useState, useEffect, useCallback } from 'react';
import type { CartItem, SelectedOption } from '../types';

const uuid = () => crypto.randomUUID();

// Cart is per-tab, stored in sessionStorage (NOT shared via localStorage)
const CART_KEY = 'bnm-cart';

const loadCart = (): CartItem[] => {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveCart = (cart: CartItem[]) => {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
};

// ── Cart singleton ─────────────────────────────────────────────────────────────
// cart lives at module level so all useCart() callers share the same reference.
// _listeners holds one setState fn per mounted component — called on every change.

let _cart: CartItem[] = loadCart();
const _listeners = new Set<(cart: CartItem[]) => void>();

const _setCart = (updater: (prev: CartItem[]) => CartItem[]) => {
  _cart = updater(_cart);
  saveCart(_cart);
  _listeners.forEach((notify) => notify([..._cart]));
};

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>(() => [..._cart]);

  // Subscribe / unsubscribe this instance
  useEffect(() => {
    _listeners.add(setCart);
    return () => { _listeners.delete(setCart); };
  }, []);

  const addToCart = useCallback(
    (
      menuItemId: string,
      name: string,
      price: number,
      imageUrl: string,
      quantity: number,
      selectedOptions: SelectedOption[],
      note: string
    ) => {
      const optionsDelta = selectedOptions.reduce((s, o) => s + o.priceDelta, 0);
      const unitPrice = price + optionsDelta;
      const lineTotal = unitPrice * quantity;

      _setCart((prev) => [
        ...prev,
        {
          cartItemId: uuid(),
          menuItemId,
          name,
          price,
          imageUrl,
          quantity,
          selectedOptions,
          note,
          lineTotal,
        },
      ]);
    },
    []
  );

  const updateQuantity = useCallback(
    (cartItemId: string, quantity: number) => {
      if (quantity < 1) return;
      _setCart((prev) =>
        prev.map((item) => {
          if (item.cartItemId !== cartItemId) return item;
          const optionsDelta = item.selectedOptions.reduce((s, o) => s + o.priceDelta, 0);
          const unitPrice = item.price + optionsDelta;
          return { ...item, quantity, lineTotal: unitPrice * quantity };
        })
      );
    },
    []
  );

  const removeFromCart = useCallback(
    (cartItemId: string) => {
      _setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    },
    []
  );

  const clearCart = useCallback(() => {
    _setCart(() => []);
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.lineTotal, 0);
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return {
    cart,
    subtotal,
    itemCount,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };
};

// ─── Client Session ID (per tab, per browser session) ────────────────────────
export const useClientSession = () => {
  const [clientSessionId] = useState<string>(() => {
    const existing = sessionStorage.getItem('bnm-client-session-id');
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem('bnm-client-session-id', id);
    return id;
  });
  return clientSessionId;
};

// ─── PIN gate (per tab) ───────────────────────────────────────────────────────
export const usePINGate = (requiredPin: string) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('bnm-pin-unlocked') === 'true';
  });

  const unlock = useCallback(
    (pin: string) => {
      if (pin === requiredPin) {
        sessionStorage.setItem('bnm-pin-unlocked', 'true');
        setUnlocked(true);
        return true;
      }
      return false;
    },
    [requiredPin]
  );

  return { unlocked, unlock };
};

// ─── Elapsed time ─────────────────────────────────────────────────────────────
export const useElapsedTime = (createdAt: string, endAt?: string) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    const calc = () => {
      const end = endAt ? new Date(endAt).getTime() : Date.now();
      const diffMs = end - new Date(createdAt).getTime();
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      return mins > 0 ? `${mins} phút ${secs}s` : `${secs}s`;
    };

    setElapsed(calc());

    // If endAt is fixed, compute once and stop — no interval needed
    if (endAt) return;

    const id = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(id);
  }, [createdAt, endAt]);

  return elapsed;
};
