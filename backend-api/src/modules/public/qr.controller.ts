import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';

/** GET /api/public/qr/:qrToken */
export async function resolveQr(req: Request, res: Response, next: NextFunction) {
  try {
    const qrToken = String(req.params.qrToken);

    const table = await prisma.diningTable.findUnique({
      where: { qrToken },
      include: {
        branch: { include: { store: true } },
        sessions: {
          where: { status: 'OPEN' },
          orderBy: { openedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!table || table.status === 'INACTIVE') {
      throw AppError.notFound('QR token');
    }

    const activeSession = table.sessions[0] ?? null;

    return success(res, {
      table: {
        id: table.id,
        tableCode: table.tableCode,
        displayName: table.displayName,
        qrToken: table.qrToken,
        status: table.status,
      },
      branch: {
        id: table.branch.id,
        name: table.branch.name,
      },
      store: {
        id: table.branch.store.id,
        name: table.branch.store.name,
      },
      activeSession: activeSession
        ? { id: activeSession.id, status: activeSession.status }
        : null,
    });
  } catch (err) {
    next(err);
  }
}
