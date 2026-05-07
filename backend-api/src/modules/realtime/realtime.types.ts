import { DeliveryStatus, OrderStatus, OrderType } from '@prisma/client';

export type RealtimeOrderEventType =
  | 'order.created'
  | 'order.status.updated'
  | 'delivery.status.updated'
  | 'order.cancelled';

export type RealtimeDeliveryStatus = Exclude<DeliveryStatus, 'ACCEPTED'>;

export type RealtimeOrderEvent = {
  type: RealtimeOrderEventType;
  orderId: string;
  orderCode: string;
  storeId: string;
  branchId: string;
  orderType: OrderType;
  status: OrderStatus;
  deliveryStatus?: RealtimeDeliveryStatus;
  updatedAt: string;
};
