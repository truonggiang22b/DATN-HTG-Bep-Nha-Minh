import { z } from 'zod';

export const updateStatusSchema = z.object({
  toStatus: z.enum(['PREPARING', 'READY', 'SERVED', 'CANCELLED']),
  reason: z.string().max(500).nullable().optional(),
});

export const orderHistoryQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  tableId: z.string().optional(),
  status: z.enum(['NEW', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']).optional(),
  branchId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type OrderHistoryQuery = z.infer<typeof orderHistoryQuerySchema>;
