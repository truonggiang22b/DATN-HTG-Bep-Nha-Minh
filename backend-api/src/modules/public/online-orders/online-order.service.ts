/**
 * online-order.service.ts — Business logic for online ordering
 * Phase 2: Bếp Nhà Mình Online Ordering
 */

import { prisma } from '../../../lib/prisma';
import { AppError } from '../../../utils/errors';
import { generateOrderCode } from '../../../utils/orderCode';
import {
  haversineKm,
  calcShippingFee,
  estimateDeliveryMinutes,
  BranchDeliveryConfig,
} from './geo.utils';
import { EstimateFeeInput, CreateOnlineOrderInput } from './online-order.schema';

// ─── Estimate Delivery Fee ────────────────────────────────────────────────────

export async function estimateDeliveryFeeService(input: EstimateFeeInput) {
  const branch = await prisma.branch.findUnique({
    where: { id: input.branchId, isActive: true },
  });

  if (!branch) {
    throw AppError.notFound('Chi nhánh không tồn tại hoặc không hoạt động');
  }

  if (!branch.latitude || !branch.longitude) {
    throw AppError.badRequest(
      'BRANCH_NO_LOCATION',
      'Chi nhánh chưa cấu hình tọa độ giao hàng. Vui lòng liên hệ quán.'
    );
  }

  const config: BranchDeliveryConfig = {
    deliveryBaseKm: branch.deliveryBaseKm ?? 2,
    deliveryBaseFee: branch.deliveryBaseFee ?? 15000,
    deliveryFeePerKm: branch.deliveryFeePerKm ?? 5000,
    deliveryMaxKm: branch.deliveryMaxKm ?? 10,
  };

  const distanceKm = haversineKm(
    branch.latitude,
    branch.longitude,
    input.customerLat,
    input.customerLng
  );

  const feeResult = calcShippingFee(distanceKm, config);
  const estimatedMinutes = feeResult.isDeliverable
    ? estimateDeliveryMinutes(distanceKm)
    : null;

  return {
    distanceKm,
    isDeliverable: feeResult.isDeliverable,
    shippingFee: feeResult.fee,
    estimatedMinutes,
    reason: feeResult.reason,
    branchName: branch.name,
  };
}

// ─── Create Online Order ──────────────────────────────────────────────────────

export async function createOnlineOrderService(input: CreateOnlineOrderInput) {
  // 1. Idempotency check
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { deliveryInfo: true },
  });
  if (existing) {
    return {
      order: formatOrderResponse(existing),
      deliveryInfo: existing.deliveryInfo,
      isIdempotent: true,
    };
  }

  // 2. Resolve branch
  const branch = await prisma.branch.findUnique({
    where: { id: input.branchId, isActive: true },
    include: { store: true },
  });
  if (!branch) {
    throw AppError.notFound('Chi nhánh không tồn tại');
  }

  // 3. Validate + price menu items
  const menuItemIds = input.items.map((i) => i.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: menuItemIds } },
    include: { optionGroups: { include: { options: true } } },
  });
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  const soldOutNames: string[] = [];
  for (const reqItem of input.items) {
    const mi = menuItemMap.get(reqItem.menuItemId);
    if (!mi) {
      throw AppError.badRequest('INVALID_ITEM', `Món ${reqItem.menuItemId} không tồn tại`);
    }
    if (mi.status === 'SOLD_OUT') soldOutNames.push(mi.name);
    if (mi.status === 'HIDDEN') {
      throw AppError.badRequest('INVALID_ITEM', `Món ${mi.name} không còn bán`);
    }
  }
  if (soldOutNames.length > 0) {
    throw AppError.conflict('ITEM_SOLD_OUT', `Các món đã hết: ${soldOutNames.join(', ')}`, {
      soldOutItems: soldOutNames,
    });
  }

  // 4. Validate options
  for (const reqItem of input.items) {
    const mi = menuItemMap.get(reqItem.menuItemId)!;
    for (const og of mi.optionGroups) {
      if (!og.isRequired) continue;
      const selected = reqItem.selectedOptions.filter((o) => o.optionGroupId === og.id);
      if (selected.length < og.minSelect) {
        throw AppError.badRequest(
          'INVALID_OPTION',
          `Món "${mi.name}" cần chọn ít nhất ${og.minSelect} option trong nhóm "${og.name}"`
        );
      }
    }
  }

  // 5. Calculate subtotal
  let subtotal = 0;
  const orderItemsData = input.items.map((reqItem) => {
    const mi = menuItemMap.get(reqItem.menuItemId)!;
    const basePrice = Number(mi.price);
    const optionsDelta = reqItem.selectedOptions.reduce((sum, o) => sum + (o.priceDelta ?? 0), 0);
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

  // 6. Verify shipping fee on server-side (anti-tampering)
  let verifiedShippingFee = input.deliveryInfo.shippingFee;
  if (input.deliveryInfo.customerLat && input.deliveryInfo.customerLng && branch.latitude && branch.longitude) {
    const config: BranchDeliveryConfig = {
      deliveryBaseKm: branch.deliveryBaseKm ?? 2,
      deliveryBaseFee: branch.deliveryBaseFee ?? 15000,
      deliveryFeePerKm: branch.deliveryFeePerKm ?? 5000,
      deliveryMaxKm: branch.deliveryMaxKm ?? 10,
    };
    const distanceKm = haversineKm(
      branch.latitude,
      branch.longitude,
      input.deliveryInfo.customerLat,
      input.deliveryInfo.customerLng
    );
    const feeResult = calcShippingFee(distanceKm, config);
    if (!feeResult.isDeliverable) {
      throw AppError.badRequest('OUT_OF_RANGE', feeResult.reason ?? 'Địa chỉ ngoài vùng giao hàng');
    }
    verifiedShippingFee = feeResult.fee;
  }

  // 7. Generate order code for online orders
  const orderCode = `ONL-${Date.now().toString(36).toUpperCase()}`;

  // 8. Atomic create order + delivery info
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        storeId: branch.store.id,
        branchId: branch.id,
        tableId: null,         // online orders have no table
        tableSessionId: null,  // online orders have no session
        clientSessionId: input.clientSessionId,
        orderCode,
        status: 'NEW',
        orderType: 'ONLINE',
        subtotal,
        customerNote: input.deliveryInfo.note ?? null,
        idempotencyKey: input.idempotencyKey,
        items: { create: orderItemsData },
        statusHistory: {
          create: { fromStatus: null, toStatus: 'NEW' },
        },
        deliveryInfo: {
          create: {
            customerName: input.deliveryInfo.customerName,
            phone: input.deliveryInfo.phone,
            address: input.deliveryInfo.address,
            ward: input.deliveryInfo.ward ?? null,
            district: input.deliveryInfo.district ?? null,
            customerLat: input.deliveryInfo.customerLat ?? null,
            customerLng: input.deliveryInfo.customerLng ?? null,
            shippingFee: verifiedShippingFee,
            deliveryStatus: 'PENDING',
            note: input.deliveryInfo.note ?? null,
          },
        },
      },
      include: { deliveryInfo: true },
    });
    return newOrder;
  });

  return {
    order: formatOrderResponse(order),
    deliveryInfo: order.deliveryInfo,
    isIdempotent: false,
  };
}

// ─── Track Online Order ───────────────────────────────────────────────────────

export async function getOnlineOrderService(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      deliveryInfo: true,
      branch: true,
    },
  });

  if (!order) throw AppError.notFound('Đơn hàng');
  if (order.orderType !== 'ONLINE') {
    throw AppError.forbidden('Đây không phải đơn hàng online');
  }

  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    orderType: order.orderType,
    subtotal: Number(order.subtotal),
    customerNote: order.customerNote,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    branchName: order.branch.name,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.nameSnapshot,
      quantity: item.quantity,
      unitPrice: Number(item.priceSnapshot),
      lineTotal: Number(item.lineTotal),
      note: item.note,
      selectedOptions: item.selectedOptionsSnapshotJson,
    })),
    deliveryInfo: order.deliveryInfo
      ? {
          customerName: order.deliveryInfo.customerName,
          phone: order.deliveryInfo.phone,
          address: order.deliveryInfo.address,
          ward: order.deliveryInfo.ward,
          district: order.deliveryInfo.district,
          distanceKm: order.deliveryInfo.distanceKm,
          shippingFee: order.deliveryInfo.shippingFee,
          deliveryStatus: order.deliveryInfo.deliveryStatus,
          note: order.deliveryInfo.note,
        }
      : null,
    total: Number(order.subtotal) + (order.deliveryInfo?.shippingFee ?? 0),
  };
}

// ─── Admin: List Delivery Orders ─────────────────────────────────────────────

export async function listDeliveryOrdersService(filters: {
  storeId: string;
  branchId?: string;
  deliveryStatus?: string;
  date?: string;
}) {
  const where: Record<string, unknown> = {
    orderType: 'ONLINE',
    storeId: filters.storeId,
  };

  if (filters.branchId) where.branchId = filters.branchId;

  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      deliveryInfo: true,
      items: true,
      branch: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter by deliveryStatus if provided
  const filtered = filters.deliveryStatus
    ? orders.filter((o) => o.deliveryInfo?.deliveryStatus === filters.deliveryStatus)
    : orders;

  return filtered.map((o) => ({
    id: o.id,
    orderCode: o.orderCode,
    status: o.status,
    createdAt: o.createdAt,
    branchName: o.branch.name,
    subtotal: Number(o.subtotal),
    shippingFee: o.deliveryInfo?.shippingFee ?? 0,
    total: Number(o.subtotal) + (o.deliveryInfo?.shippingFee ?? 0),
    itemCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
    deliveryInfo: o.deliveryInfo
      ? {
          customerName: o.deliveryInfo.customerName,
          phone: o.deliveryInfo.phone,
          address: o.deliveryInfo.address,
          ward: o.deliveryInfo.ward,
          district: o.deliveryInfo.district,
          distanceKm: o.deliveryInfo.distanceKm,
          deliveryStatus: o.deliveryInfo.deliveryStatus,
        }
      : null,
  }));
}

// ─── Admin: Update Delivery Status ───────────────────────────────────────────

export async function updateDeliveryStatusService(
  orderId: string,
  deliveryStatus: string,
  reason?: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { deliveryInfo: true },
  });

  if (!order) throw AppError.notFound('Đơn hàng');
  if (order.orderType !== 'ONLINE') {
    throw AppError.badRequest('WRONG_TYPE', 'Không phải đơn hàng online');
  }
  if (!order.deliveryInfo) {
    throw AppError.badRequest('NO_DELIVERY', 'Đơn hàng không có thông tin giao hàng');
  }

  // Also update order.status to reflect delivery progress
  const orderStatusMap: Record<string, 'NEW' | 'PREPARING' | 'READY' | 'SERVED'> = {
    ACCEPTED: 'NEW',
    PREPARING: 'PREPARING',
    DELIVERING: 'READY',
    DELIVERED: 'SERVED',
  };
  const newOrderStatus = orderStatusMap[deliveryStatus];

  await prisma.$transaction(async (tx) => {
    await tx.deliveryInfo.update({
      where: { orderId },
      data: { deliveryStatus: deliveryStatus as never, note: reason },
    });

    if (newOrderStatus) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: newOrderStatus },
      });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: newOrderStatus,
          reason: reason ?? `Cập nhật trạng thái giao hàng: ${deliveryStatus}`,
        },
      });
    }
  });

  return { success: true, deliveryStatus, orderId };
}

// ─── Admin: Get/Update Branch Delivery Config ─────────────────────────────────

export async function getBranchDeliveryConfigService(branchId: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      deliveryBaseKm: true,
      deliveryBaseFee: true,
      deliveryFeePerKm: true,
      deliveryMaxKm: true,
    },
  });
  if (!branch) throw AppError.notFound('Chi nhánh');
  return branch;
}

export async function updateBranchDeliveryConfigService(
  branchId: string,
  data: Partial<{
    latitude: number;
    longitude: number;
    deliveryBaseKm: number;
    deliveryBaseFee: number;
    deliveryFeePerKm: number;
    deliveryMaxKm: number;
  }>
) {
  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw AppError.notFound('Chi nhánh');

  const updated = await prisma.branch.update({
    where: { id: branchId },
    data,
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      deliveryBaseKm: true,
      deliveryBaseFee: true,
      deliveryFeePerKm: true,
      deliveryMaxKm: true,
    },
  });
  return updated;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatOrderResponse(order: { id: string; orderCode: string; status: string; subtotal: unknown; createdAt: Date }) {
  return {
    id: order.id,
    orderCode: order.orderCode,
    status: order.status,
    subtotal: Number(order.subtotal),
    createdAt: order.createdAt,
  };
}
