import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/apiResponse';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    logger.warn({ code: err.code, path: req.path }, err.message);
    return errorResponse(res, err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    return errorResponse(res, 400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', err.flatten());
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  return errorResponse(res, 500, 'INTERNAL_ERROR', 'Lỗi hệ thống nội bộ');
}
