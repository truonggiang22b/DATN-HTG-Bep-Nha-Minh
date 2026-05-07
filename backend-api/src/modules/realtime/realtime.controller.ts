import { NextFunction, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { subscribeInternalOrderEvents } from './realtime.bus';

export async function streamInternalOrderEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const branchId = typeof req.query.branchId === 'string' ? req.query.branchId : undefined;

    if (branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { storeId: true },
      });

      if (!branch || branch.storeId !== user.storeId) {
        throw AppError.forbidden('Chi nhanh khong thuoc quan cua ban');
      }
    }

    subscribeInternalOrderEvents(req, res, {
      storeId: user.storeId,
      branchId,
    });
  } catch (err) {
    next(err);
  }
}
