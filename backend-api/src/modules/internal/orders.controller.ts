import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { updateStatusSchema, orderHistoryQuerySchema } from './orders.validator';
import { isValidTransition } from '../../utils/statusTransitions';
import { OrderStatus } from '@prisma/client';
import { publishOrderEvent } from '../realtime/realtime.bus';
import type { RealtimeDeliveryStatus } from '../realtime/realtime.types';

/** GET /api/internal/orders/active — KDS */
export async function getActiveOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { branchId } = req.query as { branchId?: string };

    // Resolve which branch to scope to
    let targetBranchId = user.branchId ?? undefined;
    if (branchId) {
      // Verify the requested branch belongs to user's store
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch || branch.storeId !== user.storeId) {
        throw AppError.forbidden('Chi nhánh không thuộc quán của bạn');
      }
      targetBranchId = branchId;
    }

    // Đầu ngày hôm nay theo UTC (Prisma lưu UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        storeId: user.storeId,
        ...(targetBranchId && { branchId: targetBranchId }),
        OR: [
          { status: { in: ['NEW', 'PREPARING', 'READY'] } },
          { status: 'SERVED', createdAt: { gte: todayStart } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        table: true,
        items: true,
        deliveryInfo: { select: { customerName: true, phone: true } }, // Phase 2
      },
    });

    return success(res, {
      orders: orders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        status: o.status,
        orderType: o.orderType,
        tableDisplayName: o.table?.displayName ?? null,
        // Phân biệt đơn online: hiển tên khách thay vì bàn
        customerName: o.orderType === 'ONLINE' ? (o as any).deliveryInfo?.customerName ?? null : null,
        customerPhone: o.orderType === 'ONLINE' ? (o as any).deliveryInfo?.phone ?? null : null,
        tableId: o.tableId,
        customerNote: o.customerNote,
        subtotal: Number(o.subtotal),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        items: o.items.map((item) => ({
          id: item.id,
          name: item.nameSnapshot,
          quantity: item.quantity,
          unitPrice: Number(item.priceSnapshot),
          lineTotal: Number(item.lineTotal),
          note: item.note,
          selectedOptions: item.selectedOptionsSnapshotJson,
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
}


/** PATCH /api/internal/orders/:id/status */
export async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);
    const input = updateStatusSchema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw AppError.notFound('Đơn hàng');

    // Tenant isolation
    if (order.storeId !== user.storeId) {
      throw AppError.forbidden('Đơn hàng không thuộc quán của bạn');
    }

    // Validate transition
    if (!isValidTransition(order.status, input.toStatus as OrderStatus)) {
      throw AppError.badRequest(
        'INVALID_TRANSITION',
        `Không thể chuyển trạng thái từ ${order.status} sang ${input.toStatus}`
      );
    }

    // Cancel requires reason
    if (input.toStatus === 'CANCELLED' && !input.reason) {
      throw AppError.badRequest('REASON_REQUIRED', 'Hủy đơn cần có lý do');
    }

    // Update order + log history in transaction
    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.order.update({
        where: { id },
        data: { status: input.toStatus as OrderStatus },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: input.toStatus as OrderStatus,
          reason: input.reason ?? null,
          changedByUserId: user.id,
        },
      });
      return up;
    });

    // ── Sync deliveryInfo.deliveryStatus cho đơn ONLINE ───────────────────────────────
    // Khi bếp đổi trạng thái đơn, khách và admin cũng thấy thay đổi
    let syncedDeliveryStatus: RealtimeDeliveryStatus | undefined;
    if (updated.orderType === 'ONLINE') {
      const kdsToDelivery: Partial<Record<string, string>> = {
        PREPARING:  'PREPARING',   // bếp nhận đơn & bắt đầu nấu
        // READY: không đổi — bếp đang gói, chưa giao cho shipper
        SERVED:     'DELIVERING',  // bếp đưa cho shipper = shipper đang trên đường
                                   // ⚠️ DELIVERED chỉ khi SHIPPER xác nhận tay
        CANCELLED:  'CANCELLED',   // hủy từ KDS → khách cũng biết
      };
      const newDelivStatus = kdsToDelivery[input.toStatus];
      if (newDelivStatus) {
        const deliveryUpdate = await prisma.deliveryInfo.updateMany({
          where: {
            orderId: id,
            // An toàn: không ghi đè nếu đã DELIVERED hoặc CANCELLED
            deliveryStatus: { notIn: ['DELIVERED', 'CANCELLED'] as any },
          },
          data: { deliveryStatus: newDelivStatus as any },
        });
        if (deliveryUpdate.count > 0) {
          syncedDeliveryStatus = newDelivStatus as RealtimeDeliveryStatus;
        }
      }
    }

    publishOrderEvent({
      type: updated.status === 'CANCELLED' ? 'order.cancelled' : 'order.status.updated',
      orderId: updated.id,
      orderCode: updated.orderCode,
      storeId: updated.storeId,
      branchId: updated.branchId,
      orderType: updated.orderType,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });

    if (syncedDeliveryStatus) {
      publishOrderEvent({
        type: 'delivery.status.updated',
        orderId: updated.id,
        orderCode: updated.orderCode,
        storeId: updated.storeId,
        branchId: updated.branchId,
        orderType: updated.orderType,
        status: updated.status,
        deliveryStatus: syncedDeliveryStatus,
        updatedAt: updated.updatedAt.toISOString(),
      });
    }

    return success(res, {
      id: updated.id,
      orderCode: updated.orderCode,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/internal/orders/history */
export async function getOrderHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const query = orderHistoryQuerySchema.parse(req.query);

    // Branch scope validation
    let targetBranchId = user.branchId ?? undefined;
    if (query.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: query.branchId } });
      if (!branch || branch.storeId !== user.storeId) {
        throw AppError.forbidden('Chi nhánh không thuộc quán của bạn');
      }
      targetBranchId = query.branchId;
    }

    const where = {
      storeId: user.storeId,
      ...(targetBranchId && { branchId: targetBranchId }),
      ...(query.tableId && { tableId: query.tableId }),
      ...(query.status && { status: query.status as OrderStatus }),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
              ...(query.dateTo && { lte: new Date(query.dateTo + 'T23:59:59') }),
            },
          }
        : {}),
    };

    const [total, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { table: true, items: true },
      }),
    ]);

    return success(res, {
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
      orders: orders.map((o) => ({
        id: o.id,
        orderCode: o.orderCode,
        status: o.status,
        tableDisplayName: o.table?.displayName ?? null,
        orderType: o.orderType,
        subtotal: Number(o.subtotal),
        customerNote: o.customerNote,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        itemCount: o.items.length,
        items: o.items.map((item) => ({
          name: item.nameSnapshot,
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
          note: item.note,
          selectedOptions: item.selectedOptionsSnapshotJson,
        })),
      })),
    });
  } catch (err) {
    next(err);
  }
}
