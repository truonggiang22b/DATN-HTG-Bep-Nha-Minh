import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../../lib/supabase';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { z } from 'zod';
import { env } from '../../config/env';

// Regular client for user-facing auth (login + refresh)
const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken là bắt buộc'),
});


const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

/** POST /api/auth/login */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Authenticate with Supabase Auth (uses anon key — correct for signInWithPassword)
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      throw AppError.unauthorized('Email hoặc mật khẩu không đúng');
    }

    // Load user profile + roles from our DB
    const user = await prisma.user.findUnique({
      where: { supabaseAuthUserId: authData.user.id },
      include: { roles: true },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa');
    }

    return success(res, {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresIn: authData.session.expires_in,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        storeId: user.storeId,
        branchId: user.defaultBranchId,
        roles: user.roles.map((r) => r.role),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.slice(7);
    if (token) {
      await supabaseAdmin.auth.admin.signOut(token as string);
    }
    return success(res, { message: 'Đã đăng xuất thành công' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/refresh */
export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: rt } = refreshSchema.parse(req.body);

    const { data, error } = await supabaseClient.auth.refreshSession({
      refresh_token: rt,
    });

    if (error || !data.session) {
      throw AppError.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const supabaseUserId = data.user?.id ?? data.session.user.id;
    const user = await prisma.user.findUnique({
      where: { supabaseAuthUserId: supabaseUserId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa');
    }

    return success(res, {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/internal/me */
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw AppError.unauthorized();
    return success(res, { user: req.user });
  } catch (err) {
    next(err);
  }
}
