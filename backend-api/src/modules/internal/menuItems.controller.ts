import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { z } from 'zod';

const createMenuItemSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  price: z.number().min(0),
  imageUrl: z.string().url().nullable().optional(),
  shortDescription: z.string().max(500).nullable().optional(),
  tags: z.array(z.string()).default([]),
  sortOrder: z.number().int().min(0).default(0),
});

const updateMenuItemSchema = createMenuItemSchema.partial();
const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SOLD_OUT', 'HIDDEN']),
});

async function assertTenantOwnsCategory(categoryId: string, storeId: string) {
  const cat = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { branch: true },
  });
  if (!cat || cat.branch.storeId !== storeId) {
    throw AppError.forbidden('Danh mục không thuộc quán của bạn');
  }
  return cat;
}

/** GET /api/internal/menu-items */
export async function listMenuItems(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const branchId = user.branchId;
    if (!branchId) throw AppError.badRequest('NO_BRANCH', 'User chưa được gán chi nhánh');

    const items = await prisma.menuItem.findMany({
      where: { category: { branchId } },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      include: {
        category: true,
        optionGroups: { include: { options: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    return success(res, {
      items: items.map((item) => ({
        ...item,
        price: Number(item.price),
        tagsJson: undefined,
        tags: item.tagsJson,
      })),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/internal/menu-items */
export async function createMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const data = createMenuItemSchema.parse(req.body);
    await assertTenantOwnsCategory(data.categoryId, user.storeId);

    const item = await prisma.menuItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        price: data.price,
        imageUrl: data.imageUrl ?? null,
        shortDescription: data.shortDescription ?? null,
        tagsJson: data.tags,
        sortOrder: data.sortOrder,
        status: 'ACTIVE',
      },
    });

    return success(res, { item: { ...item, price: Number(item.price) } }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/menu-items/:id */
export async function updateMenuItem(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);
    const data = updateMenuItemSchema.parse(req.body);

    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: { include: { branch: true } } },
    });
    if (!existing) throw AppError.notFound('Món ăn');
    if (existing.category.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Món ăn không thuộc quán của bạn');
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.shortDescription !== undefined && { shortDescription: data.shortDescription }),
        ...(data.tags !== undefined && { tagsJson: data.tags }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      },
    });

    return success(res, { item: { ...updated, price: Number(updated.price) } });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/menu-items/:id/status */
export async function updateMenuItemStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const id = String(req.params.id);
    const { status } = updateStatusSchema.parse(req.body);

    const existing = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: { include: { branch: true } } },
    });
    if (!existing) throw AppError.notFound('Món ăn');
    if (existing.category.branch.storeId !== user.storeId) {
      throw AppError.forbidden('Món ăn không thuộc quán của bạn');
    }

    const updated = await prisma.menuItem.update({ where: { id }, data: { status } });
    return success(res, { item: { id: updated.id, name: updated.name, status: updated.status } });
  } catch (err) {
    next(err);
  }
}
