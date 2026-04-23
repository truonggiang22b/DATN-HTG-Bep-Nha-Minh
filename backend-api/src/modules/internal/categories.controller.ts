import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { z } from 'zod';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  sortOrder: z.number().int().min(0).optional().default(0),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'HIDDEN']).optional(),
});

/** GET /api/internal/categories */
export async function listCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const branchId = user.branchId;
    if (!branchId) throw AppError.badRequest('NO_BRANCH', 'User chưa được gán chi nhánh');

    const categories = await prisma.category.findMany({
      where: { branchId },
      orderBy: { sortOrder: 'asc' },
    });

    return success(res, { categories });
  } catch (err) {
    next(err);
  }
}

/** POST /api/internal/categories */
export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const branchId = user.branchId;
    if (!branchId) throw AppError.badRequest('NO_BRANCH', 'User chưa được gán chi nhánh');

    const data = createCategorySchema.parse(req.body);

    const category = await prisma.category.create({
      data: { ...data, branchId, status: 'ACTIVE' },
    });

    return success(res, { category }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/categories/:id */
export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);
    const data = updateCategorySchema.parse(req.body);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Danh mục');

    // Tenant isolation
    const branch = await prisma.branch.findUnique({ where: { id: existing.branchId } });
    if (!branch || branch.storeId !== user.storeId) {
      throw AppError.forbidden('Danh mục không thuộc quán của bạn');
    }

    const updated = await prisma.category.update({ where: { id }, data });
    return success(res, { category: updated });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/internal/categories/:id — soft delete (HIDDEN), cascade items */
export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);

    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        branch: true,
        menuItems: { where: { status: { in: ['ACTIVE', 'SOLD_OUT'] } } },
      },
    });
    if (!existing) throw AppError.notFound('Danh mục');
    if (existing.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Danh mục không thuộc quán của bạn');
    }

    // Cascade: ẩn toàn bộ món ACTIVE/SOLD_OUT cùng lúc
    await prisma.$transaction([
      prisma.menuItem.updateMany({
        where: { categoryId: id, status: { in: ['ACTIVE', 'SOLD_OUT'] } },
        data: { status: 'HIDDEN' },
      }),
      prisma.category.update({
        where: { id },
        data: { status: 'HIDDEN' },
      }),
    ]);

    return success(res, {
      message: 'Danh mục đã ẩn khỏi menu',
      hiddenItemsCount: existing.menuItems.length,
    });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/categories/:id/restore */
export async function restoreCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!existing) throw AppError.notFound('Danh mục');
    if (existing.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Danh mục không thuộc quán của bạn');
    }

    // Chỉ khôi phục category, không tự động bật lại món con
    const updated = await prisma.category.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    return success(res, { category: updated });
  } catch (err) {
    next(err);
  }
}
