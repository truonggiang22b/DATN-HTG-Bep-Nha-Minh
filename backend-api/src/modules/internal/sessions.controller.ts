import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';

/** GET /api/internal/tables/:id/current-session */
export async function getCurrentTableSession(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);

    const table = await prisma.diningTable.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!table) throw AppError.notFound('Bàn');

    if (table.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Bàn không thuộc quán của bạn');
    }

    const session = await prisma.tableSession.findFirst({
      where: { tableId: id, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
      include: {
        orders: {
          orderBy: { createdAt: 'asc' },
          include: { items: true },
        },
      },
    });

    if (!session) {
      return success(res, {
        table: {
          id: table.id,
          displayName: table.displayName,
          tableCode: table.tableCode,
        },
        session: null,
      });
    }

    const payableOrders = session.orders.filter((order) => order.status !== 'CANCELLED');
    const payableTotal = payableOrders.reduce((sum, order) => sum + Number(order.subtotal), 0);
    const itemCount = payableOrders.reduce(
      (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );
    const activeOrderCount = session.orders.filter((order) =>
      ['NEW', 'PREPARING', 'READY'].includes(order.status)
    ).length;

    return success(res, {
      table: {
        id: table.id,
        displayName: table.displayName,
        tableCode: table.tableCode,
      },
      session: {
        id: session.id,
        status: session.status,
        openedAt: session.openedAt,
        orderCounter: session.orderCounter,
        orderCount: session.orders.length,
        payableOrderCount: payableOrders.length,
        activeOrderCount,
        itemCount,
        payableTotal,
        orders: session.orders.map((order) => ({
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          subtotal: Number(order.subtotal),
          customerNote: order.customerNote,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          isPayable: order.status !== 'CANCELLED',
          items: order.items.map((item) => ({
            id: item.id,
            name: item.nameSnapshot,
            quantity: item.quantity,
            unitPrice: Number(item.priceSnapshot),
            lineTotal: Number(item.lineTotal),
            note: item.note,
            selectedOptions: item.selectedOptionsSnapshotJson,
          })),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/internal/tables/:id/reset-session */
export async function resetTableSession(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);

    const table = await prisma.diningTable.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!table) throw AppError.notFound('Bàn');

    // Tenant isolation
    if (table.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Bàn không thuộc quán của bạn');
    }

    // Find active session
    const activeSession = await prisma.tableSession.findFirst({
      where: { tableId: id, status: 'OPEN' },
      orderBy: { openedAt: 'desc' },
    });

    if (!activeSession) {
      return success(res, { message: 'Không có phiên nào đang mở', sessionId: null });
    }

    // Check for unfinished orders
    const activeOrders = await prisma.order.findMany({
      where: {
        tableSessionId: activeSession.id,
        status: { in: ['NEW', 'PREPARING', 'READY'] },
      },
      select: { id: true, orderCode: true, status: true },
    });

    if (activeOrders.length > 0) {
      throw AppError.conflict(
        'SESSION_HAS_ACTIVE_ORDERS',
        `Còn ${activeOrders.length} đơn chưa hoàn thành. Hãy phục vụ hoặc hủy trước khi reset bàn.`,
        { activeOrders }
      );
    }

    // Close the session
    const closed = await prisma.tableSession.update({
      where: { id: activeSession.id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    return success(res, {
      message: `Đã reset bàn ${table.displayName}`,
      closedSession: {
        id: closed.id,
        status: closed.status,
        closedAt: closed.closedAt,
        orderCounter: closed.orderCounter,
      },
    });
  } catch (err) {
    next(err);
  }
}
