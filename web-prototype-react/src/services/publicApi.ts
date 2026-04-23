/**
 * publicApi.ts
 * Tất cả API calls không cần auth (customer-facing).
 */
import { apiClient } from './apiClient';
import type {
  QRResolveData,
  MenuResponse,
  SubmitOrderPayload,
  ApiOrder,
} from '../types';

// ── QR Resolution ─────────────────────────────────────────────────────────────
export const resolveQR = async (qrToken: string): Promise<QRResolveData> => {
  const res = await apiClient.get(`/public/qr/${qrToken}`);
  return res.data.data as QRResolveData;
};

// ── Menu ──────────────────────────────────────────────────────────────────────
export const getMenu = async (branchId: string): Promise<MenuResponse> => {
  const res = await apiClient.get(`/public/branches/${branchId}/menu`);
  return res.data.data as MenuResponse;
};

// ── Submit Order ──────────────────────────────────────────────────────────────
export const submitOrder = async (payload: SubmitOrderPayload): Promise<ApiOrder> => {
  const res = await apiClient.post('/public/orders', payload);
  return res.data.data.order as ApiOrder;
};

// ── Track Order ───────────────────────────────────────────────────────────────
export const trackOrder = async (
  orderId: string,
  qrToken: string
): Promise<ApiOrder> => {
  const res = await apiClient.get(`/public/orders/${orderId}`, {
    params: { qrToken },
  });
  // Backend trả order fields trực tiếp trong data (không wrap trong .order)
  return res.data.data as ApiOrder;
};

// ── Build submit payload helper ───────────────────────────────────────────────
export interface CartItemForSubmit {
  menuItemId: string;
  quantity: number;
  selectedOptions: {
    optionGroupId: string;
    optionId: string;
    name: string;
    priceDelta: number;
  }[];
  note?: string;
}

export const buildSubmitPayload = (
  qrToken: string,
  clientSessionId: string,
  idempotencyKey: string,
  items: CartItemForSubmit[]
): SubmitOrderPayload => ({
  qrToken,
  clientSessionId,
  idempotencyKey,
  items,
});
