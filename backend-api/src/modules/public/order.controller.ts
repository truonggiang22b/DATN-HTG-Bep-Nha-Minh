import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { createOrderSchema } from './order.validator';
import { generateOrderCode } from '../../utils/orderCode';
import { CUSTOMER_STATUS_LABELS } from '../../utils/statusTransitions';

/** POST /api/public/orders */
export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createOrderSchema.parse(req.body);

    if (input.items.length === 0) {
      throw AppError.badRequest('EMPTY_CART', 'Giỏ hàng không được rỗng');
    }

    // 1. Resolve table by QR token
    const table = await prisma.diningTable.findUnique({
      where: { qrToken: input.qrToken },
      include: { branch: { include: { store: true } } },
    });
    if (!table || table.status === 'INACTIVE') {
      throw AppError.badRequest('INVALID_QR', 'QR không hợp lệ hoặc bàn đã ngừng hoạt động');
    }

    // 2. Idempotency check — return existing order if same key used
    const existingOrder = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { items: true },
    });
    if (existingOrder) {
      return success(
        res,
        {
          order: {
            id: existingOrder.id,
            orderCode: existingOrder.orderCode,
            status: existingOrder.status,
            subtotal: Number(existingOrder.subtotal),
            createdAt: existingOrder.createdAt,
            tableSessionId: existingOrder.tableSessionId,
          },
        },
        200 // idempotent — same resource
      );
    }

    // 3. Validate all menu items
    const menuItemIds = input.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      include: { optionGroups: { include: { options: true } } },
    });

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    // Check all items exist and are ACTIVE (not SOLD_OUT or HIDDEN)
    const soldOutNames: string[] = [];
    for (const reqItem of input.items) {
      const mi = menuItemMap.get(reqItem.menuItemId);
      if (!mi) {
        throw AppError.badRequest('INVALID_ITEM', `Món ${reqItem.menuItemId} không tồn tại`);
      }
      if (mi.status === 'SOLD_OUT') {
        soldOutNames.push(mi.name);
      }
      if (mi.status === 'HIDDEN') {
        throw AppError.badRequest('INVALID_ITEM', `Món ${mi.name} không còn bán`);
      }
    }
    if (soldOutNames.length > 0) {
      throw AppError.conflict('ITEM_SOLD_OUT', `Các món đã hết: ${soldOutNames.join(', ')}`, { soldOutItems: soldOutNames });
    }

    // 4. Validate required options
    for (const reqItem of input.items) {
      const mi = menuItemMap.get(reqItem.menuItemId)!;
      for (const og of mi.optionGroups) {
        if (!og.isRequired) continue;
        const selectedForGroup = reqItem.selectedOptions.filter(
          (o) => o.optionGroupId === og.id
        );
        if (selectedForGroup.length < og.minSelect) {
          throw AppError.badRequest(
            'INVALID_OPTION',
            `Món "${mi.name}" cần chọn ít nhất ${og.minSelect} option trong nhóm "${og.name}"`
          );
        }
      }
    }

    // 5. Build order items with snapshots + calculate subtotal
    let subtotal = 0;
    const orderItemsData = input.items.map((reqItem) => {
      const mi = menuItemMap.get(reqItem.menuItemId)!;
      const basePrice = Number(mi.price);
      const optionsDelta = reqItem.selectedOptions.reduce(
        (sum, o) => sum + (o.priceDelta ?? 0),
        0
      );
      const unitPrice = basePrice + optionsDelta;
      const lineTotal = unitPrice * reqItem.quantity;
      subtotal += lineTotal;

      return {
        menuItemId: mi.id,
        nameSnapshot: mi.name,
        priceSnapshot: unitPrice,
        quantity: reqItem.quantity,
        selectedOptionsSnapshotJson: reqItem.selectedOptions,
        note: reqItem.note ?? '',
        lineTotal,
      };
    });

    // 6. Atomic: find or open table session, then create order
    const order = await prisma.$transaction(async (tx) => {
      // Find active session or create one
      let session = await tx.tableSession.findFirst({
        where: { tableId: table.id, status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
      });

      if (!session) {
        session = await tx.tableSession.create({
          data: { tableId: table.id, status: 'OPEN', orderCounter: 0 },
        });
      }

      // Increment counter and generate order code
      const updatedSession = await tx.tableSession.update({
        where: { id: session.id },
        data: { orderCounter: { increment: 1 } },
      });

      const orderCode = generateOrderCode(table.displayName, updatedSession.orderCounter);

      // Create order + items + initial status history
      const newOrder = await tx.order.create({
        data: {
          storeId: table.branch.store.id,
          branchId: table.branch.id,
          tableId: table.id,
          tableSessionId: session.id,
          clientSessionId: input.clientSessionId,
          orderCode,
          status: 'NEW',
          subtotal,
          customerNote: input.customerNote ?? null,
          idempotencyKey: input.idempotencyKey,
          items: { create: orderItemsData },
          statusHistory: {
            create: { fromStatus: null, toStatus: 'NEW' },
          },
        },
      });

      return newOrder;
    });

    return success(
      res,
      {
        order: {
          id: order.id,
          orderCode: order.orderCode,
          status: order.status,
          subtotal: Number(order.subtotal),
          createdAt: order.createdAt,
          tableSessionId: order.tableSessionId,
        },
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

/** GET /api/public/orders/:orderId?qrToken=... */
export async function trackOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = String(req.params.orderId);
    const { qrToken } = req.query as { qrToken?: string };

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        table: { include: { branch: { include: { store: true } } } },
        tableSession: true,
        items: true,
      },
    });

    if (!order) throw AppError.notFound('Đơn hàng');

    // Security: verify qrToken belongs to same table
    if (qrToken && order.table.qrToken !== qrToken) {
      throw AppError.forbidden('QR token không khớp với đơn hàng');
    }

    return success(res, {
      id: order.id,
      orderCode: order.orderCode,
      tableDisplayName: order.table.displayName,
      branchId: order.branchId,
      storeId: order.storeId,
      internalStatus: order.status,
      customerStatus: CUSTOMER_STATUS_LABELS[order.status],
      sessionStatus: order.tableSession.status,
      subtotal: Number(order.subtotal),
      customerNote: order.customerNote,
      updatedAt: order.updatedAt,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.nameSnapshot,
        quantity: item.quantity,
        unitPrice: Number(item.priceSnapshot),
        lineTotal: Number(item.lineTotal),
        note: item.note,
        selectedOptions: item.selectedOptionsSnapshotJson,
      })),
    });
  } catch (err) {
    next(err);
  }
}
