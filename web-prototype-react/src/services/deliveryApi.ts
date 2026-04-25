/**
 * deliveryApi.ts — Admin API functions for online delivery orders
 * Phase 2: Bếp Nhà Mình Online Ordering
 * Tách riêng để không ảnh hưởng internalApi.ts hiện có
 */

import { apiClient } from './apiClient';

export type DeliveryStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'DELIVERING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryOrderSummary {
  id: string;
  orderCode: string;
  status: string; // Kitchen status (NEW/PREPARING/READY/SERVED/CANCELLED)
  subtotal: number;
  createdAt: string;
  updatedAt: string;
  branchName: string;
  deliveryInfo: {
    id: string;
    customerName: string;
    phone: string;
    address: string;
    ward: string | null;
    district: string | null;
    distanceKm: number | null;
    shippingFee: number;
    deliveryStatus: DeliveryStatus;
    note: string | null;
  } | null;
  itemCount: number;
}

export interface ListDeliveryOrdersResponse {
  orders: DeliveryOrderSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DeliveryConfigPayload {
  latitude?: number;
  longitude?: number;
  deliveryBaseKm?: number;
  deliveryBaseFee?: number;
  deliveryFeePerKm?: number;
  deliveryMaxKm?: number;
}

export interface BranchDeliveryConfigFull {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  deliveryBaseKm: number | null;
  deliveryBaseFee: number | null;
  deliveryFeePerKm: number | null;
  deliveryMaxKm: number | null;
}

// ─── API functions ────────────────────────────────────────────────────────────

export const deliveryApi = {
  /** Lấy danh sách đơn giao hàng */
  listOrders: async (params?: {
    page?: number;
    pageSize?: number;
    deliveryStatus?: DeliveryStatus;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ListDeliveryOrdersResponse> => {
    const res = await apiClient.get('/internal/delivery-orders', { params });
    return res.data.data;
  },

  /** Cập nhật trạng thái giao hàng */
  updateStatus: async (
    orderId: string,
    deliveryStatus: DeliveryStatus,
    reason?: string
  ): Promise<{ order: { id: string; orderCode: string }; deliveryStatus: DeliveryStatus }> => {
    const res = await apiClient.patch(`/internal/delivery-orders/${orderId}/status`, {
      deliveryStatus,
      reason,
    });
    return res.data.data;
  },

  /** Lấy config giao hàng của chi nhánh */
  getBranchConfig: async (branchId: string): Promise<BranchDeliveryConfigFull> => {
    const res = await apiClient.get(`/internal/branches/${branchId}/delivery-config`);
    return res.data.data;
  },

  /** Cập nhật config giao hàng chi nhánh */
  updateBranchConfig: async (
    branchId: string,
    payload: DeliveryConfigPayload
  ): Promise<BranchDeliveryConfigFull> => {
    const res = await apiClient.patch(`/internal/branches/${branchId}/delivery-config`, payload);
    return res.data.data;
  },
};
