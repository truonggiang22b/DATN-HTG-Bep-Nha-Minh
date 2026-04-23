import { OrderStatus } from '@prisma/client';

/** Allowed status transitions per spec section 7.4 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['SERVED'],
  SERVED: [],
  CANCELLED: [],
};

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getAllowedTransitions(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from];
}

/** Customer-facing status labels — spec section 6 (02_quy_trinh) */
export const CUSTOMER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Đã tiếp nhận',
  PREPARING: 'Đang chuẩn bị',
  READY: 'Đang mang ra',
  SERVED: 'Đã phục vụ',
  CANCELLED: 'Đơn đã hủy',
};
