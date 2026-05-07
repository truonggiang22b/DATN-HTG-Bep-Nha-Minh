import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { z } from 'zod';

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  isRequired: z.boolean().default(false),
  minSelect: z.number().int().min(0).default(0),
  maxSelect: z.number().int().min(1).default(1),
  sortOrder: z.number().int().min(0).default(0),
});

const updateGroupSchema = createGroupSchema.partial();

const createOptionSchema = z.object({
  name: z.string().min(1).max(100),
  priceDelta: z.number().default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

const updateOptionSchema = createOptionSchema.partial();

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Assert the menuItem belongs to the requesting tenant */
async function assertTenantOwnsItem(menuItemId: string, storeId: string) {
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    include: { category: { include: { branch: true } } },
  });
  if (!item) throw AppError.notFound('Món ăn');
  if (item.category.branch.storeId !== storeId) {
    throw AppError.forbidden('Món ăn không thuộc quán của bạn');
  }
  return item;
}

/** Assert the optionGroup belongs to the requesting tenant */
async function assertTenantOwnsGroup(groupId: string, storeId: string) {
  const group = await prisma.menuOptionGroup.findUnique({
    where: { id: groupId },
    include: { menuItem: { include: { category: { include: { branch: true } } } } },
  });
  if (!group) throw AppError.notFound('Nhóm phân loại');
  if (group.menuItem.category.branch.storeId !== storeId) {
    throw AppError.forbidden('Nhóm phân loại không thuộc quán của bạn');
  }
  return group;
}

/** Assert the option belongs to the requesting tenant */
async function assertTenantOwnsOption(optionId: string, storeId: string) {
  const option = await prisma.menuOption.findUnique({
    where: { id: optionId },
    include: {
      optionGroup: {
        include: { menuItem: { include: { category: { include: { branch: true } } } } },
      },
    },
  });
  if (!option) throw AppError.notFound('Lựa chọn');
  if (option.optionGroup.menuItem.category.branch.storeId !== storeId) {
    throw AppError.forbidden('Lựa chọn không thuộc quán của bạn');
  }
  return option;
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** GET /api/internal/menu-items/:id/option-groups */
export async function listOptionGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const menuItemId = String(req.params.id);
    await assertTenantOwnsItem(menuItemId, user.storeId);

    const groups = await prisma.menuOptionGroup.findMany({
      where: { menuItemId },
      orderBy: { sortOrder: 'asc' },
      include: {
        options: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return success(res, {
      groups: groups.map((g) => ({
        ...g,
        options: g.options.map((o) => ({ ...o, priceDelta: Number(o.priceDelta) })),
      })),
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/internal/menu-items/:id/option-groups */
export async function createOptionGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const menuItemId = String(req.params.id);
    await assertTenantOwnsItem(menuItemId, user.storeId);

    const data = createGroupSchema.parse(req.body);

    const group = await prisma.menuOptionGroup.create({
      data: {
        menuItemId,
        name: data.name,
        isRequired: data.isRequired,
        minSelect: data.minSelect,
        maxSelect: data.maxSelect,
        sortOrder: data.sortOrder,
      },
      include: { options: true },
    });

    return success(res, { group }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/option-groups/:groupId */
export async function updateOptionGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const groupId = String(req.params.groupId);
    await assertTenantOwnsGroup(groupId, user.storeId);

    const data = updateGroupSchema.parse(req.body);

    const group = await prisma.menuOptionGroup.update({
      where: { id: groupId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.minSelect !== undefined && { minSelect: data.minSelect }),
        ...(data.maxSelect !== undefined && { maxSelect: data.maxSelect }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
    });

    return success(res, {
      group: {
        ...group,
        options: group.options.map((o) => ({ ...o, priceDelta: Number(o.priceDelta) })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/internal/option-groups/:groupId — cascade deletes all options */
export async function deleteOptionGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const groupId = String(req.params.groupId);
    await assertTenantOwnsGroup(groupId, user.storeId);

    // Cascade: xóa options trước, rồi xóa group
    await prisma.menuOption.deleteMany({ where: { optionGroupId: groupId } });
    await prisma.menuOptionGroup.delete({ where: { id: groupId } });

    return success(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

/** POST /api/internal/option-groups/:groupId/options */
export async function createOption(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const groupId = String(req.params.groupId);
    await assertTenantOwnsGroup(groupId, user.storeId);

    const data = createOptionSchema.parse(req.body);

    const option = await prisma.menuOption.create({
      data: {
        optionGroupId: groupId,
        name: data.name,
        priceDelta: data.priceDelta,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });

    return success(res, { option: { ...option, priceDelta: Number(option.priceDelta) } }, 201);
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/internal/options/:optionId */
export async function updateOption(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const optionId = String(req.params.optionId);
    await assertTenantOwnsOption(optionId, user.storeId);

    const data = updateOptionSchema.parse(req.body);

    const option = await prisma.menuOption.update({
      where: { id: optionId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.priceDelta !== undefined && { priceDelta: data.priceDelta }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return success(res, { option: { ...option, priceDelta: Number(option.priceDelta) } });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/internal/options/:optionId */
export async function deleteOption(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const optionId = String(req.params.optionId);
    await assertTenantOwnsOption(optionId, user.storeId);

    await prisma.menuOption.delete({ where: { id: optionId } });

    return success(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
