import { Response } from 'express';

export function success<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data });
}

export function errorResponse(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return res.status(status).json({
    error: { code, message, ...(details !== undefined && { details }) },
  });
}
