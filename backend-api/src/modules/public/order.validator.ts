import { z } from 'zod';

export const createOrderSchema = z.object({
  qrToken: z.string().min(1, 'qrToken là bắt buộc'),
  clientSessionId: z.string().min(1, 'clientSessionId là bắt buộc'),
  tableSessionId: z.string().nullable().optional(),
  idempotencyKey: z.string().min(1, 'idempotencyKey là bắt buộc'),
  customerNote: z.string().max(300).nullable().optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
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
      })
    )
    .min(1, 'Giỏ hàng không được rỗng'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
