import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/errors';
import { success } from '../../utils/apiResponse';
import { createOrderSchema } from './order.validator';
import { generateOrderCode } from '../../utils/orderCode';
import { CUSTOMER_STATUS_LABELS } from '../../utils/statusTransitions';
import { publishOrderEvent } from '../realtime/realtime.bus';
import { subscribePublicOrderEvents } from '../realtime/realtime.bus';

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

    // 4a. Build optionPriceMap từ DB data (đã được include) — không tin priceDelta từ client
    type DbOption = { id: string; priceDelta: number; groupId: string; menuItemId: string };
    const optionPriceMap = new Map<string, DbOption>();
    for (const mi of menuItems) {
      for (const og of (mi as any).optionGroups ?? []) {
        for (const opt of og.options ?? []) {
          optionPriceMap.set(opt.id, {
            id: opt.id,
            priceDelta: Number(opt.priceDelta),
            groupId: og.id,
            menuItemId: mi.id,
          });
        }
      }
    }

    // 4b. Validate required options + validate optionId thuộc về menuItem
    for (const reqItem of input.items) {
      const mi = menuItemMap.get(reqItem.menuItemId)!;

      // Validate từng optionId: phải tồn tại trong DB và thuộc về món này
      for (const opt of reqItem.selectedOptions) {
        const dbOpt = optionPriceMap.get(opt.optionId);
        if (!dbOpt) {
          throw AppError.badRequest('INVALID_OPTION', `Option không tồn tại: ${opt.optionId}`);
        }
        if (dbOpt.menuItemId !== mi.id) {
          throw AppError.badRequest('INVALID_OPTION', `Option không thuộc món "${mi.name}"`);
        }
      }

      // Validate required option groups
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

    // 5. Build order items — dùng giá DB, không dùng priceDelta từ client
    let subtotal = 0;
    const orderItemsData = input.items.map((reqItem) => {
      const mi = menuItemMap.get(reqItem.menuItemId)!;
      const basePrice = Number(mi.price);
      const optionsDelta = reqItem.selectedOptions.reduce((sum, o) => {
        const dbOpt = optionPriceMap.get(o.optionId)!;
        return sum + dbOpt.priceDelta; // giá từ DB, an toàn
      }, 0);
      const unitPrice = basePrice + optionsDelta;
      const lineTotal = unitPrice * reqItem.quantity;
      subtotal += lineTotal;

      // Lưu snapshot với giá DB (override bất kỳ priceDelta nào từ client)
      const sanitizedOptions = reqItem.selectedOptions.map((o) => ({
        optionGroupId: o.optionGroupId,
        optionId: o.optionId,
        name: o.name,
        priceDelta: optionPriceMap.get(o.optionId)!.priceDelta, // giá DB
      }));

      return {
        menuItemId: mi.id,
        nameSnapshot: mi.name,
        priceSnapshot: unitPrice,
        quantity: reqItem.quantity,
        selectedOptionsSnapshotJson: sanitizedOptions,
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

    publishOrderEvent({
      type: 'order.created',
      orderId: order.id,
      orderCode: order.orderCode,
      storeId: order.storeId,
      branchId: order.branchId,
      orderType: order.orderType,
      status: order.status,
      updatedAt: order.updatedAt.toISOString(),
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

/** GET /api/public/orders/:orderId/events?qrToken=... */
export async function streamOrderEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const orderId = String(req.params.orderId);
    const { qrToken } = req.query as { qrToken?: string };

    await validateDineInTrackingAccess(orderId, qrToken);
    subscribePublicOrderEvents(req, res, orderId);
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
    if (order.orderType !== 'DINE_IN' || !order.table || !order.tableSession) {
      throw AppError.badRequest('WRONG_TYPE', 'Use /api/public/online-orders/:orderId for online orders');
    }

    // Security: qrToken BẮTBUỘC — phải khớp với bàn của đơn hàng
    if (!qrToken) {
      throw AppError.forbidden('Cần qrToken để xem đơn hàng');
    }
    if (order.table.qrToken !== qrToken) {
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

async function validateDineInTrackingAccess(orderId: string, qrToken?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { table: true, tableSession: true },
  });

  if (!order) throw AppError.notFound('Đơn hàng');
  if (order.orderType !== 'DINE_IN' || !order.table || !order.tableSession) {
    throw AppError.badRequest('WRONG_TYPE', 'Use /api/public/online-orders/:orderId for online orders');
  }

  if (!qrToken) {
    throw AppError.forbidden('Cần qrToken để xem đơn hàng');
  }
  if (order.table.qrToken !== qrToken) {
    throw AppError.forbidden('QR token không khớp với đơn hàng');
  }
}
