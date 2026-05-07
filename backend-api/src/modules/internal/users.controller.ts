import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { supabaseAdmin } from '../../lib/supabase';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { z } from 'zod';
import { env } from '../../config/env';
import { sendInviteEmail } from '../../lib/email';

const createStaffSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'KITCHEN', 'SHIPPER']),
  defaultBranchId: z.string().uuid().optional(),
  temporaryPassword: z.string().min(8, 'Mật khẩu tạm phải ít nhất 8 ký tự'),
});

const updateStaffSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'KITCHEN', 'SHIPPER']).optional(),
  defaultBranchId: z.string().uuid().nullable().optional(),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu mới phải ít nhất 8 ký tự'),
});

const inviteEmailSchema = z.object({
  temporaryPassword: z.string().min(8).optional(),
});

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Quan tri',
  MANAGER: 'Quan ly',
  KITCHEN: 'Bep',
  SHIPPER: 'Giao hang',
};

function mapUser(user: {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  defaultBranchId: string | null;
  createdAt: Date;
  roles: { role: string }[];
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    isActive: user.isActive,
    defaultBranchId: user.defaultBranchId,
    roles: user.roles.map((r) => r.role),
    createdAt: user.createdAt,
  };
}

/** GET /api/internal/users */
export async function listStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;

    const users = await prisma.user.findMany({
      where: { storeId: user.storeId },
      orderBy: { createdAt: 'asc' },
      include: { roles: true },
    });

    return success(res, { users: users.map(mapUser) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/internal/users */
export async function createStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUser = req.user!;
    const data = createStaffSchema.parse(req.body);

    // Kiểm tra email trùng trong cùng store
    const existingUser = await prisma.user.findFirst({
      where: { storeId: adminUser.storeId, email: data.email },
    });
    if (existingUser) {
      throw AppError.badRequest('EMAIL_EXISTS', 'Email này đã được dùng trong quán của bạn');
    }

    // Tạo Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.temporaryPassword,
      email_confirm: true, // bỏ qua bước xác thực email
    });

    if (authError || !authData.user) {
      const msg = authError?.message ?? 'Tạo tài khoản thất bại';
      throw AppError.badRequest('AUTH_CREATE_FAILED', msg);
    }

    let newUser;
    try {
      // Tạo User nội bộ + Role trong transaction
      newUser = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            supabaseAuthUserId: authData.user!.id,
            storeId: adminUser.storeId,
            defaultBranchId: data.defaultBranchId ?? adminUser.branchId ?? null,
            displayName: data.displayName,
            email: data.email,
            isActive: true,
          },
          include: { roles: true },
        });

        await tx.userRole_Rel.create({
          data: {
            userId: created.id,
            role: data.role,
            storeId: adminUser.storeId,
            branchId: data.defaultBranchId ?? adminUser.branchId ?? null,
          },
        });

        return tx.user.findUnique({
          where: { id: created.id },
          include: { roles: true },
        });
      });
    } catch (dbErr) {
      // Rollback: xóa Supabase Auth user nếu DB fail
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
      throw dbErr;
    }

    return success(res, { user: mapUser(newUser!) }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/users/:id */
export async function updateStaff(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUser = req.user!;
    const id = String(req.params.id);
    const data = updateStaffSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!existing) throw AppError.notFound('Nhân viên');
    if (existing.storeId !== adminUser.storeId) {
      throw AppError.forbidden('Nhân viên không thuộc quán của bạn');
    }

    // Cập nhật thông tin cơ bản
    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.defaultBranchId !== undefined) updateData.defaultBranchId = data.defaultBranchId;

    // Đổi role: xóa role cũ, tạo role mới
    if (data.role !== undefined) {
      await prisma.$transaction([
        prisma.userRole_Rel.deleteMany({ where: { userId: id } }),
        prisma.userRole_Rel.create({
          data: {
            userId: id,
            role: data.role,
            storeId: adminUser.storeId,
            branchId: existing.defaultBranchId ?? adminUser.branchId ?? null,
          },
        }),
      ]);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { roles: true },
    });

    return success(res, { user: mapUser(updated) });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/users/:id/status */
export async function updateStaffStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUser = req.user!;
    const id = String(req.params.id);
    const { isActive } = updateStatusSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!existing) throw AppError.notFound('Nhân viên');
    if (existing.storeId !== adminUser.storeId) {
      throw AppError.forbidden('Nhân viên không thuộc quán của bạn');
    }

    // Guard: không cho admin khóa chính mình
    if (existing.supabaseAuthUserId === adminUser.supabaseUserId) {
      throw AppError.badRequest('CANNOT_LOCK_SELF', 'Bạn không thể khóa tài khoản của chính mình');
    }

    // Guard: không khóa admin cuối cùng của store
    if (!isActive) {
      const isAdmin = existing.roles.some((r) => r.role === 'ADMIN');
      if (isAdmin) {
        const activeAdminCount = await prisma.user.count({
          where: {
            storeId: adminUser.storeId,
            isActive: true,
            roles: { some: { role: 'ADMIN' } },
          },
        });
        if (activeAdminCount <= 1) {
          throw AppError.badRequest(
            'LAST_ADMIN',
            'Không thể khóa admin cuối cùng của quán. Hãy gán quyền admin cho nhân viên khác trước.',
          );
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      include: { roles: true },
    });

    return success(res, { user: mapUser(updated) });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/users/:id/reset-password — Admin đặt lại mật khẩu cho nhân viên */
export async function resetStaffPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUser = req.user!;
    const id = String(req.params.id);
    const { newPassword } = resetPasswordSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!existing) throw AppError.notFound('Nhân viên');
    if (existing.storeId !== adminUser.storeId) {
      throw AppError.forbidden('Nhân viên không thuộc quán của bạn');
    }
    if (!existing.supabaseAuthUserId) {
      throw AppError.badRequest('NO_AUTH_USER', 'Tài khoản này chưa có Supabase Auth user');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      existing.supabaseAuthUserId,
      { password: newPassword }
    );
    if (error) {
      throw AppError.badRequest('RESET_FAILED', error.message ?? 'Đặt lại mật khẩu thất bại');
    }

    return success(res, { message: `Đã đặt lại mật khẩu cho ${existing.displayName}` });
  } catch (err) {
    next(err);
  }
}

/** POST /api/internal/users/:id/invite-email — Admin gui email moi nhan vien */
export async function sendStaffInviteEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const adminUser = req.user!;
    const id = String(req.params.id);
    const { temporaryPassword } = inviteEmailSchema.parse(req.body ?? {});

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
    if (!existing) throw AppError.notFound('Nhan vien');
    if (existing.storeId !== adminUser.storeId) {
      throw AppError.forbidden('Nhan vien khong thuoc quan cua ban');
    }
    if (!existing.isActive) {
      throw AppError.badRequest('USER_INACTIVE', 'Tai khoan dang bi khoa, hay mo khoa truoc khi gui email moi');
    }

    const role = existing.roles[0]?.role ?? 'KITCHEN';
    const result = await sendInviteEmail({
      to: existing.email,
      displayName: existing.displayName,
      roleLabel: ROLE_LABEL[role] ?? role,
      loginUrl: `${env.FRONTEND_URL.replace(/\/$/, '')}/login`,
      temporaryPassword,
    });

    return success(res, {
      message: result.sent
        ? `Da gui email moi cho ${existing.displayName}`
        : 'Chua cau hinh email provider, he thong da tao san noi dung moi',
      emailSent: result.sent,
      provider: result.provider,
      subject: result.subject,
      body: result.body,
      mailtoUrl: result.mailtoUrl,
    });
  } catch (err) {
    next(err);
  }
}
