import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AppError } from '../utils/errors';

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    const hasRole = req.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      return next(AppError.forbidden(`Yêu cầu quyền: ${allowedRoles.join(' hoặc ')}`));
    }
    next();
  };
}
