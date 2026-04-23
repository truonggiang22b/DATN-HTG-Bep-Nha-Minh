/**
 * internalApi.ts
 * Tất cả API calls cần auth (staff-facing: KDS, Admin).
 * Token được inject tự động bởi apiClient interceptor.
 */
import { apiClient } from './apiClient';
import type {
  AuthUser,
  ApiOrder,
  ApiCategory,
  ApiMenuItem,
  ApiTable,
  OrderStatus,
} from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data.data as LoginResponse;
};

export const getMe = async (): Promise<AuthUser> => {
  const res = await apiClient.get('/internal/me');
  return res.data.data.user as AuthUser;
};

// ═══════════════════════════════════════════════════════════════════════════════
// KDS — ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

export const getActiveOrders = async (): Promise<ApiOrder[]> => {
  const res = await apiClient.get('/internal/orders/active');
  return res.data.data.orders as ApiOrder[];
};

export const updateOrderStatus = async (
  orderId: string,
  toStatus: OrderStatus
): Promise<ApiOrder> => {
  const res = await apiClient.patch(`/internal/orders/${orderId}/status`, {
    toStatus,
  });
  return res.data.data as ApiOrder;
};

export const cancelOrder = async (
  orderId: string,
  reason?: string
): Promise<ApiOrder> => {
  const res = await apiClient.patch(`/internal/orders/${orderId}/status`, {
    toStatus: 'CANCELLED',
    reason: reason ?? 'Hủy từ KDS',
  });
  return res.data.data as ApiOrder;
};

export interface OrderHistoryParams {
  page?: number;
  pageSize?: number;  // Backend dùng 'pageSize', không phải 'limit'
  status?: OrderStatus;
  dateFrom?: string;  // YYYY-MM-DD
  dateTo?: string;    // YYYY-MM-DD
}

export interface OrderHistoryResponse {
  orders: ApiOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getOrderHistory = async (
  params?: OrderHistoryParams
): Promise<OrderHistoryResponse> => {
  const res = await apiClient.get('/internal/orders/history', { params });
  return res.data.data as OrderHistoryResponse;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

export const getCategories = async (): Promise<ApiCategory[]> => {
  const res = await apiClient.get('/internal/categories');
  return res.data.data.categories as ApiCategory[];
};

export const createCategory = async (data: {
  name: string;
  sortOrder?: number;
}): Promise<ApiCategory> => {
  const res = await apiClient.post('/internal/categories', data);
  return res.data.data.category as ApiCategory;
};

export const updateCategory = async (
  id: string,
  data: { name?: string; sortOrder?: number; status?: string }
): Promise<ApiCategory> => {
  const res = await apiClient.patch(`/internal/categories/${id}`, data);
  return res.data.data.category as ApiCategory;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — MENU ITEMS
// ═══════════════════════════════════════════════════════════════════════════════

export const getMenuItems = async (): Promise<ApiMenuItem[]> => {
  const res = await apiClient.get('/internal/menu-items');
  return res.data.data.items as ApiMenuItem[];
};

export interface CreateMenuItemData {
  categoryId: string;
  name: string;
  price: number;
  shortDescription?: string;
  imageUrl?: string;
  tags?: string[];
  sortOrder?: number;
}

export const createMenuItem = async (
  data: CreateMenuItemData
): Promise<ApiMenuItem> => {
  const res = await apiClient.post('/internal/menu-items', data);
  return res.data.data.item as ApiMenuItem;
};

export const updateMenuItem = async (
  id: string,
  data: Partial<CreateMenuItemData>
): Promise<ApiMenuItem> => {
  const res = await apiClient.patch(`/internal/menu-items/${id}`, data);
  return res.data.data.item as ApiMenuItem;
};

export const updateItemStatus = async (
  id: string,
  status: 'ACTIVE' | 'SOLD_OUT' | 'HIDDEN'
): Promise<ApiMenuItem> => {
  const res = await apiClient.patch(`/internal/menu-items/${id}/status`, {
    status,
  });
  return res.data.data.item as ApiMenuItem;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — TABLES
// ═══════════════════════════════════════════════════════════════════════════════

export const getTables = async (): Promise<ApiTable[]> => {
  const res = await apiClient.get('/internal/tables');
  return res.data.data.tables as ApiTable[];
};

export const createTable = async (data: {
  tableCode: string;
  displayName: string;
}): Promise<ApiTable> => {
  const res = await apiClient.post('/internal/tables', data);
  return res.data.data.table as ApiTable;
};

export const updateTable = async (
  id: string,
  data: { displayName?: string; status?: 'ACTIVE' | 'INACTIVE' }
): Promise<ApiTable> => {
  const res = await apiClient.patch(`/internal/tables/${id}`, data);
  return res.data.data.table as ApiTable;
};

export interface ResetSessionResult {
  closedSession: { id: string; status: string } | null;
  message: string;
}

export const resetTableSession = async (
  tableId: string
): Promise<ResetSessionResult> => {
  const res = await apiClient.post(`/internal/tables/${tableId}/reset-session`);
  return res.data.data as ResetSessionResult;
};

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD
// ═══════════════════════════════════════════════════════════════════════════════

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}

export const uploadMenuImage = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post('/internal/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data as UploadResult;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — SOFT DELETE & RESTORE
// ═══════════════════════════════════════════════════════════════════════════════

export const deleteMenuItem = async (id: string) => {
  const res = await apiClient.delete(`/internal/menu-items/${id}`);
  return res.data.data;
};

export const restoreMenuItem = async (id: string) => {
  const res = await apiClient.patch(`/internal/menu-items/${id}/restore`);
  return res.data.data;
};

export const deleteCategory = async (id: string) => {
  const res = await apiClient.delete(`/internal/categories/${id}`);
  return res.data.data as { message: string; hiddenItemsCount: number };
};

export const restoreCategory = async (id: string) => {
  const res = await apiClient.patch(`/internal/categories/${id}/restore`);
  return res.data.data;
};

export const deactivateTable = async (id: string) => {
  const res = await apiClient.delete(`/internal/tables/${id}`);
  return res.data.data;
};

export const restoreTableApi = async (id: string) => {
  const res = await apiClient.patch(`/internal/tables/${id}/restore`);
  return res.data.data;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN — STAFF MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiStaff {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  defaultBranchId: string | null;
  roles: string[];
  createdAt: string;
}

export const listStaff = async (): Promise<ApiStaff[]> => {
  const res = await apiClient.get('/internal/users');
  return res.data.data.users as ApiStaff[];
};

export interface CreateStaffData {
  displayName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'KITCHEN';
  defaultBranchId?: string;
  temporaryPassword: string;
}

export const createStaff = async (data: CreateStaffData): Promise<ApiStaff> => {
  const res = await apiClient.post('/internal/users', data);
  return res.data.data.user as ApiStaff;
};

export const updateStaff = async (
  id: string,
  data: { displayName?: string; role?: 'ADMIN' | 'MANAGER' | 'KITCHEN'; defaultBranchId?: string | null }
): Promise<ApiStaff> => {
  const res = await apiClient.patch(`/internal/users/${id}`, data);
  return res.data.data.user as ApiStaff;
};

export const updateStaffStatus = async (id: string, isActive: boolean): Promise<ApiStaff> => {
  const res = await apiClient.patch(`/internal/users/${id}/status`, { isActive });
  return res.data.data.user as ApiStaff;
};
