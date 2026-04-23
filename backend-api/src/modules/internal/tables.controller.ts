import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const createTableSchema = z.object({
  tableCode: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
});

const updateTableSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

/** GET /api/internal/tables */
export async function listTables(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const branchId = user.branchId;
    if (!branchId) throw AppError.badRequest('NO_BRANCH', 'User chưa được gán chi nhánh');

    const tables = await prisma.diningTable.findMany({
      where: { branchId },
      orderBy: { tableCode: 'asc' },
      include: {
        sessions: {
          where: { status: 'OPEN' },
          take: 1,
          orderBy: { openedAt: 'desc' },
        },
      },
    });

    return success(res, {
      tables: tables.map((t) => ({
        id: t.id,
        tableCode: t.tableCode,
        displayName: t.displayName,
        qrToken: t.qrToken,
        status: t.status,
        hasActiveSession: t.sessions.length > 0,
        activeSessionId: t.sessions[0]?.id ?? null,
        createdAt: t.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/internal/tables */
export async function createTable(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const branchId = user.branchId;
    if (!branchId) throw AppError.badRequest('NO_BRANCH', 'User chưa được gán chi nhánh');

    const data = createTableSchema.parse(req.body);

    const table = await prisma.diningTable.create({
      data: {
        branchId,
        tableCode: data.tableCode,
        displayName: data.displayName,
        qrToken: `qr-${randomUUID().slice(0, 16)}`,
        status: 'ACTIVE',
      },
    });

    return success(res, { table }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/tables/:id */
export async function updateTable(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);
    const data = updateTableSchema.parse(req.body);

    const existing = await prisma.diningTable.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) throw AppError.notFound('Bàn');
    if (existing.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Bàn không thuộc quán của bạn');
    }

    // Guard: không cho ngừng sử dụng khi còn session/order đang xử lý
    if (data.status === 'INACTIVE') {
      const openSession = await prisma.tableSession.findFirst({
        where: { tableId: id, status: 'OPEN' },
      });
      if (openSession) {
        throw AppError.badRequest(
          'TABLE_HAS_OPEN_SESSION',
          'Không thể ngừng sử dụng bàn này vì bàn còn phiên hoặc đơn đang xử lý. Hãy hoàn tất/hủy đơn và reset phiên trước.',
        );
      }

      const activeOrder = await prisma.order.findFirst({
        where: {
          tableId: id,
          status: { in: ['NEW', 'PREPARING', 'READY'] },
        },
      });
      if (activeOrder) {
        throw AppError.badRequest(
          'TABLE_HAS_ACTIVE_ORDER',
          'Không thể ngừng sử dụng bàn này vì bàn còn đơn đang xử lý. Hãy hoàn tất hoặc hủy đơn trước.',
        );
      }
    }

    const updated = await prisma.diningTable.update({ where: { id }, data });
    return success(res, { table: updated });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/internal/tables/:id — soft delete (set INACTIVE) */
export async function deactivateTable(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);

    const existing = await prisma.diningTable.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) throw AppError.notFound('Bàn');
    if (existing.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Bàn không thuộc quán của bạn');
    }

    // Guard: kiểm tra session/order đang xử lý
    const openSession = await prisma.tableSession.findFirst({
      where: { tableId: id, status: 'OPEN' },
    });
    if (openSession) {
      throw AppError.badRequest(
        'TABLE_HAS_OPEN_SESSION',
        'Không thể ngừng sử dụng bàn này vì bàn còn phiên hoặc đơn đang xử lý. Hãy hoàn tất/hủy đơn và reset phiên trước.',
      );
    }
    const activeOrder = await prisma.order.findFirst({
      where: { tableId: id, status: { in: ['NEW', 'PREPARING', 'READY'] } },
    });
    if (activeOrder) {
      throw AppError.badRequest(
        'TABLE_HAS_ACTIVE_ORDER',
        'Không thể ngừng sử dụng bàn này vì bàn còn đơn đang xử lý.',
      );
    }

    const updated = await prisma.diningTable.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    return success(res, { table: updated });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/tables/:id/restore */
export async function restoreTable(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);

    const existing = await prisma.diningTable.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) throw AppError.notFound('Bàn');
    if (existing.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Bàn không thuộc quán của bạn');
    }

    const updated = await prisma.diningTable.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    return success(res, { table: updated });
  } catch (err) {
    next(err);
  }
}
