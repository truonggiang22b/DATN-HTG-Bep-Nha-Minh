import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';

/** GET /api/public/branches/:branchId/menu */
export async function getMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const branchId = String(req.params.branchId);

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || !branch.isActive) {
      throw AppError.notFound('Chi nhánh');
    }

    const categories = await prisma.category.findMany({
      where: {
        branchId: String(branchId),
        status: 'ACTIVE',
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        menuItems: {
          where: { status: { in: ['ACTIVE', 'SOLD_OUT'] } },
          orderBy: { sortOrder: 'asc' },
          include: {
            optionGroups: {
              orderBy: { sortOrder: 'asc' },
              include: {
                options: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    const data = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      sortOrder: cat.sortOrder,
      items: cat.menuItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        imageUrl: item.imageUrl,
        shortDescription: item.shortDescription,
        tags: item.tagsJson as string[],
        status: item.status,
        sortOrder: item.sortOrder,
        optionGroups: item.optionGroups.map((og) => ({
          id: og.id,
          name: og.name,
          isRequired: og.isRequired,
          minSelect: og.minSelect,
          maxSelect: og.maxSelect,
          options: og.options.map((opt) => ({
            id: opt.id,
            name: opt.name,
            priceDelta: Number(opt.priceDelta),
          })),
        })),
      })),
    }));

    return success(res, { categories: data });
  } catch (err) {
    next(err);
  }
}
