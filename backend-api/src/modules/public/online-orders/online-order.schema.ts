/**
 * online-order.schema.ts — Zod validation schemas for online ordering
 * Phase 2: Bếp Nhà Mình Online Ordering
 */

import { z } from 'zod';

/** Regex SĐT Việt Nam: 10 số, bắt đầu 03x/05x/07x/08x/09x */
const vietnamesePhone = z
  .string()
  .regex(/^(0[3-9]\d{8})$/, 'Số điện thoại không hợp lệ (ví dụ: 0912345678)');

/** Shared order item schema (tái dùng từ order.validator pattern) */
export const onlineOrderItemSchema = z.object({
  menuItemId: z.string().min(1, 'menuItemId không được rỗng'),
  quantity: z.number().int().min(1).max(50),
  selectedOptions: z
    .array(
      z.object({
        // priceDelta KHÔNG nhận từ client — backend tự lookup từ DB
        optionGroupId: z.string().optional(),
        optionId: z.string().min(1),
        name: z.string().max(200).optional(),
      })
    )
    .default([]),
  note: z.string().max(200).optional().default(''),
});

/** POST /api/public/delivery/estimate-fee */
export const estimateFeeSchema = z.object({
  branchId: z.string().min(1, 'branchId không được rỗng'),
  customerLat: z.number().min(-90).max(90),
  customerLng: z.number().min(-180).max(180),
});

export type EstimateFeeInput = z.infer<typeof estimateFeeSchema>;

/** POST /api/public/online-orders */
export const createOnlineOrderSchema = z.object({
  branchId: z.string().min(1, 'branchId không được rỗng'),
  clientSessionId: z.string().min(1, 'clientSessionId là bắt buộc'),
  idempotencyKey: z.string().min(1, 'idempotencyKey là bắt buộc'),
  items: z.array(onlineOrderItemSchema).min(1, 'Giỏ hàng không được rỗng'),
  deliveryInfo: z.object({
    customerName: z.string().min(2, 'Tên ít nhất 2 ký tự').max(100),
    phone: vietnamesePhone,
    address: z.string().min(5, 'Địa chỉ quá ngắn').max(500),
    ward: z.string().max(100).optional(),
    district: z.string().max(100).optional(),
    customerLat: z.number().min(-90).max(90).optional(),
    customerLng: z.number().min(-180).max(180).optional(),
    shippingFee: z.number().int().min(0).max(500000), // server sẽ verify lại
    note: z.string().max(500).optional(),
  }),
});

export type CreateOnlineOrderInput = z.infer<typeof createOnlineOrderSchema>;

/** PATCH /api/internal/delivery-orders/:id/status */
export const updateDeliveryStatusSchema = z.object({
  // ACCEPTED đã được gộp vào PREPARING từ phiên bản 4-step flow
  // Admin chỉ gửi: PREPARING | DELIVERING | DELIVERED | CANCELLED
  deliveryStatus: z.enum(['PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED']),
  reason: z.string().max(500).optional(),
});

export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;

/** PATCH /api/internal/branches/:id/delivery-config */
export const updateDeliveryConfigSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  deliveryBaseKm: z.number().min(0).max(50).optional(),
  deliveryBaseFee: z.number().int().min(0).max(500000).optional(),
  deliveryFeePerKm: z.number().int().min(0).max(100000).optional(),
  deliveryMaxKm: z.number().min(0).max(100).optional(),
});

export type UpdateDeliveryConfigInput = z.infer<typeof updateDeliveryConfigSchema>;
