import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { supabaseAdmin } from '../../lib/supabase';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { z } from 'zod';

const createStaffSchema = z.object({
  displayName: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MANAGER', 'KITCHEN']),
  defaultBranchId: z.string().uuid().optional(),
  temporaryPassword: z.string().min(8, 'Mật khẩu tạm phải ít nhất 8 ký tự'),
});

const updateStaffSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'KITCHEN']).optional(),
  defaultBranchId: z.string().uuid().nullable().optional(),
});

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

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
