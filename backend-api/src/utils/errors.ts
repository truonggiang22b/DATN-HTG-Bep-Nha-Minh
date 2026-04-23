export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code: string, message: string, details?: unknown) {
    return new AppError(code, 400, message, details);
  }

  static unauthorized(message = 'Chưa đăng nhập') {
    return new AppError('UNAUTHORIZED', 401, message);
  }

  static forbidden(message = 'Không có quyền thực hiện') {
    return new AppError('FORBIDDEN', 403, message);
  }

  static notFound(resource: string) {
    return new AppError('NOT_FOUND', 404, `${resource} không tìm thấy`);
  }

  static conflict(code: string, message: string, details?: unknown) {
    return new AppError(code, 409, message, details);
  }

  static internal(message = 'Lỗi hệ thống') {
    return new AppError('INTERNAL_ERROR', 500, message);
  }
}
