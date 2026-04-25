/**
 * onlineApi.ts — API calls for Online Ordering (Phase 2)
 * Không ảnh hưởng publicApi.ts / internalApi.ts hiện có
 */

import { apiClient } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EstimateFeePayload {
  branchId: string;
  customerLat: number;
  customerLng: number;
}

export interface EstimateFeeResponse {
  distanceKm: number;
  isDeliverable: boolean;
  shippingFee: number;
  estimatedMinutes: number | null;
  reason?: string;
  branchName: string;
}

export interface OnlineOrderItem {
  menuItemId: string;
  quantity: number;
  selectedOptions: {
    optionGroupId?: string;
    optionId: string;
    name: string;
    priceDelta: number;
  }[];
  note?: string;
}

export interface CreateOnlineOrderPayload {
  branchId: string;
  clientSessionId: string;
  idempotencyKey: string;
  items: OnlineOrderItem[];
  deliveryInfo: {
    customerName: string;
    phone: string;
    address: string;
    ward?: string;
    district?: string;
    customerLat?: number;
    customerLng?: number;
    shippingFee: number;
    note?: string;
  };
}

export interface OnlineOrderResponse {
  order: {
    id: string;
    orderCode: string;
    status: string;
    subtotal: number;
    createdAt: string;
  };
  deliveryInfo: {
    customerName: string;
    phone: string;
    address: string;
    shippingFee: number;
    deliveryStatus: string;
  } | null;
  isIdempotent: boolean;
}

export interface OnlineOrderDetail {
  id: string;
  orderCode: string;
  status: string;
  orderType: string;
  subtotal: number;
  total: number;
  customerNote: string | null;
  createdAt: string;
  updatedAt: string;
  branchName: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    note: string;
    selectedOptions: { name: string; priceDelta: number }[];
  }[];
  deliveryInfo: {
    customerName: string;
    phone: string;
    address: string;
    ward: string | null;
    district: string | null;
    distanceKm: number | null;
    shippingFee: number;
    deliveryStatus: string;
    note: string | null;
  } | null;
}

export interface BranchDeliveryConfig {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  deliveryBaseKm: number | null;
  deliveryBaseFee: number | null;
  deliveryFeePerKm: number | null;
  deliveryMaxKm: number | null;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const onlineApi = {
  /** Ước tính phí ship từ tọa độ khách */
  estimateFee: async (payload: EstimateFeePayload): Promise<EstimateFeeResponse> => {
    const res = await apiClient.post('/public/delivery/estimate-fee', payload);
    return res.data.data;
  },

  /** Tạo đơn hàng online */
  createOrder: async (payload: CreateOnlineOrderPayload): Promise<OnlineOrderResponse> => {
    const res = await apiClient.post('/public/online-orders', payload);
    return res.data.data;
  },

  /** Tra cứu trạng thái đơn hàng */
  getOrder: async (orderId: string): Promise<OnlineOrderDetail> => {
    const res = await apiClient.get(`/public/online-orders/${orderId}`);
    return res.data.data;
  },

  /** Lấy config giao hàng của chi nhánh */
  getBranchDeliveryConfig: async (branchId: string): Promise<BranchDeliveryConfig> => {
    const res = await apiClient.get(`/public/branches/${branchId}/delivery-config`);
    return res.data.data;
  },
};
