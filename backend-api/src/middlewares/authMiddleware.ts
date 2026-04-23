import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../utils/errors';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Token không được cung cấp');
    }

    const token = authHeader.slice(7);

    // Use Supabase Admin to verify token — handles ES256 and HS256 transparently
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      throw AppError.unauthorized('Token không hợp lệ hoặc đã hết hạn');
    }

    // Load user + roles from our DB
    const user = await prisma.user.findUnique({
      where: { supabaseAuthUserId: supabaseUser.id },
      include: { roles: true },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa');
    }

    req.user = {
      id: user.id,
      supabaseUserId: supabaseUser.id,
      email: user.email,
      displayName: user.displayName,
      storeId: user.storeId,
      branchId: user.defaultBranchId,
      roles: user.roles.map((r) => r.role),
    };

    next();
  } catch (err) {
    next(err);
  }
}

