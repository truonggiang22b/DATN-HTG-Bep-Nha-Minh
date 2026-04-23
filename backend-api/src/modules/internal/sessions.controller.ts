import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';

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
