/**
 * TEST SUITE: Phase 2 Online Ordering APIs
 * Coverage: delivery fee estimate, online order creation/tracking, idempotency,
 * anti-tampering, delivery status lifecycle, branch delivery config, tenant guards.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

const BRANCH_1 = 'branch-bep-nha-minh-q1';
const BRANCH_2 = 'branch-com-mien-tay-q7';

const BRANCH_1_CONFIG = {
  latitude: 10.774,
  longitude: 106.701,
  deliveryBaseKm: 2,
  deliveryBaseFee: 15000,
  deliveryFeePerKm: 5000,
  deliveryMaxKm: 10,
};

const BRANCH_2_CONFIG = {
  latitude: 10.729,
  longitude: 106.721,
  deliveryBaseKm: 2,
  deliveryBaseFee: 12000,
  deliveryFeePerKm: 4000,
  deliveryMaxKm: 8,
};

const NEAR_CUSTOMER = { customerLat: 10.7769, customerLng: 106.7009 };
const FAR_CUSTOMER = { customerLat: 10.91, customerLng: 106.82 };

type BranchDeliveryConfigSnapshot = {
  latitude: number | null;
  longitude: number | null;
  deliveryBaseKm: number | null;
  deliveryBaseFee: number | null;
  deliveryFeePerKm: number | null;
  deliveryMaxKm: number | null;
};

describe('Phase 2 Online Ordering APIs', () => {
  let adminToken: string;
  let admin2Token: string | undefined;
  let kitchenToken: string;
  let menuItemId: string;
  let branch2MenuItemId: string | undefined;
  let createdOrderId: string;
  let createdOrderTrackingToken: string;
  let deliveredOrderId: string;
  let store2OrderId: string | undefined;
  let originalBranch1: BranchDeliveryConfigSnapshot;
  let originalBranch2: BranchDeliveryConfigSnapshot | undefined;

  beforeAll(async () => {
    const [branch1, branch2] = await Promise.all([
      prisma.branch.findUnique({
        where: { id: BRANCH_1 },
        select: {
          latitude: true,
          longitude: true,
          deliveryBaseKm: true,
          deliveryBaseFee: true,
          deliveryFeePerKm: true,
          deliveryMaxKm: true,
        },
      }),
      prisma.branch.findUnique({
        where: { id: BRANCH_2 },
        select: {
          latitude: true,
          longitude: true,
          deliveryBaseKm: true,
          deliveryBaseFee: true,
          deliveryFeePerKm: true,
          deliveryMaxKm: true,
        },
      }),
    ]);
    if (!branch1) throw new Error(`Missing seed branch ${BRANCH_1}`);
    originalBranch1 = branch1;
    originalBranch2 = branch2 ?? undefined;

    await prisma.branch.update({ where: { id: BRANCH_1 }, data: BRANCH_1_CONFIG });
    if (branch2) {
      await prisma.branch.update({ where: { id: BRANCH_2 }, data: BRANCH_2_CONFIG });
    }

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'Admin@123456' });
    adminToken = adminRes.body.data.accessToken;

    const kitchenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bep@bepnhaminh.vn', password: 'Kitchen@123456' });
    kitchenToken = kitchenRes.body.data.accessToken;

    const admin2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@commientry.vn', password: 'Admin@654321' });
    admin2Token = admin2Res.body.data?.accessToken;

    menuItemId = await findSimpleActiveMenuItem(BRANCH_1);
    if (branch2) {
      branch2MenuItemId = await ensureBranch2TestMenuItem();
    }
  });

  afterAll(async () => {
    await prisma.branch.update({ where: { id: BRANCH_1 }, data: originalBranch1 }).catch(() => undefined);
    if (originalBranch2) {
      await prisma.branch.update({ where: { id: BRANCH_2 }, data: originalBranch2 }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it('P2-FEE-01: public delivery config returns configured branch values', async () => {
    const res = await request(app).get(`/api/public/branches/${BRANCH_1}/delivery-config`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(BRANCH_1);
    expect(res.body.data.latitude).toBe(BRANCH_1_CONFIG.latitude);
    expect(res.body.data.deliveryBaseFee).toBe(BRANCH_1_CONFIG.deliveryBaseFee);
    expect(res.body.data).not.toHaveProperty('storeId');
  });

  it('P2-FEE-02: estimate fee inside base radius returns base fee', async () => {
    const res = await request(app)
      .post('/api/public/delivery/estimate-fee')
      .send({ branchId: BRANCH_1, ...NEAR_CUSTOMER });

    expect(res.status).toBe(200);
    expect(res.body.data.isDeliverable).toBe(true);
    expect(res.body.data.shippingFee).toBe(15000);
    expect(res.body.data.distanceKm).toBeGreaterThan(0);
    expect(res.body.data.estimatedMinutes).toBeGreaterThan(0);
  });

  it('P2-FEE-03: estimate fee outside delivery radius is not deliverable', async () => {
    const res = await request(app)
      .post('/api/public/delivery/estimate-fee')
      .send({ branchId: BRANCH_1, ...FAR_CUSTOMER });

    expect(res.status).toBe(200);
    expect(res.body.data.isDeliverable).toBe(false);
    expect(res.body.data.shippingFee).toBe(0);
    expect(res.body.data.estimatedMinutes).toBeNull();
  });

  it('P2-FEE-04: invalid coordinates are rejected by validation', async () => {
    const res = await request(app)
      .post('/api/public/delivery/estimate-fee')
      .send({ branchId: BRANCH_1, customerLat: 120, customerLng: 106.7 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('P2-ORD-01: valid online order creates ONLINE order with delivery info', async () => {
    const res = await createOnlineOrder({ shippingFee: 123456 });

    expect(res.status).toBe(201);
    expect(res.body.data.isIdempotent).toBe(false);
    expect(res.body.data.order.orderCode).toMatch(/^ONL-/);
    expect(res.body.data.order.status).toBe('NEW');
    expect(res.body.data.deliveryInfo.deliveryStatus).toBe('PENDING');
    expect(res.body.data.trackingToken).toMatch(/^[a-f0-9]{32}$/);
    createdOrderId = res.body.data.order.id;
    createdOrderTrackingToken = res.body.data.trackingToken;

    const order = await prisma.order.findUnique({
      where: { id: createdOrderId },
      include: { deliveryInfo: true },
    });
    expect(order?.orderType).toBe('ONLINE');
    expect(order?.tableId).toBeNull();
    expect(order?.tableSessionId).toBeNull();
    expect(order?.deliveryInfo?.shippingFee).toBe(15000);
    expect(order?.deliveryInfo?.distanceKm).toBeGreaterThan(0);
  });

  it('P2-ORD-02: duplicate idempotency key returns the first online order', async () => {
    const key = `p2-idem-${crypto.randomUUID()}`;
    const first = await createOnlineOrder({ idempotencyKey: key, quantity: 1 });
    const second = await createOnlineOrder({ idempotencyKey: key, quantity: 3 });

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.isIdempotent).toBe(true);
    expect(second.body.data.order.id).toBe(first.body.data.order.id);
    expect(second.body.data.order.subtotal).toBe(first.body.data.order.subtotal);
    expect(second.body.data.trackingToken).toBe(first.body.data.trackingToken);
  });

  it('P2-ORD-03: invalid phone is rejected', async () => {
    const res = await createOnlineOrder({ phone: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('P2-ORD-04: empty cart is rejected', async () => {
    const res = await request(app)
      .post('/api/public/online-orders')
      .send({
        branchId: BRANCH_1,
        clientSessionId: `p2-${crypto.randomUUID()}`,
        idempotencyKey: `p2-${crypto.randomUUID()}`,
        items: [],
        deliveryInfo: baseDeliveryInfo(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('P2-ORD-05: order with item from another branch is rejected', async () => {
    if (!branch2MenuItemId) {
      console.warn('Skipping P2-ORD-05: branch 2 menu item unavailable');
      return;
    }

    const res = await createOnlineOrder({ menuItemId: branch2MenuItemId });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ITEM');
  });

  it('P2-ORD-06: online order outside delivery range is rejected', async () => {
    const res = await createOnlineOrder({
      customerLat: FAR_CUSTOMER.customerLat,
      customerLng: FAR_CUSTOMER.customerLng,
      shippingFee: 0,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OUT_OF_RANGE');
  });

  it('P2-TRACK-01: public tracking returns items, delivery info, and total', async () => {
    const res = await request(app)
      .get(`/api/public/online-orders/${createdOrderId}`)
      .query({ token: createdOrderTrackingToken });

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdOrderId);
    expect(res.body.data.orderType).toBe('ONLINE');
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.deliveryInfo.deliveryStatus).toBe('PENDING');
    expect(res.body.data.total).toBe(res.body.data.subtotal + res.body.data.deliveryInfo.shippingFee);
  });

  it('P2-TRACK-02: public tracking requires valid tracking token', async () => {
    const missing = await request(app).get(`/api/public/online-orders/${createdOrderId}`);
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('MISSING_TOKEN');

    const wrong = await request(app)
      .get(`/api/public/online-orders/${createdOrderId}`)
      .query({ token: '0'.repeat(32) });
    expect(wrong.status).toBe(403);
  });

  it('P2-INT-01: delivery order list requires auth', async () => {
    const res = await request(app).get('/api/internal/delivery-orders');

    expect(res.status).toBe(401);
  });

  it('P2-INT-02: delivery order list is scoped and filterable by deliveryStatus', async () => {
    const res = await request(app)
      .get('/api/internal/delivery-orders?deliveryStatus=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toBeInstanceOf(Array);
    expect(res.body.data.orders.some((o: any) => o.id === createdOrderId)).toBe(true);
    for (const order of res.body.data.orders) {
      expect(order.deliveryInfo.deliveryStatus).toBe('PENDING');
    }
  });

  it('P2-INT-03: delivery status lifecycle syncs kitchen order status and history', async () => {
    const orderRes = await createOnlineOrder();
    deliveredOrderId = orderRes.body.data.order.id;

    await expectDeliveryStatusPatch(deliveredOrderId, 'PREPARING', 'PREPARING');
    await expectDeliveryStatusPatch(deliveredOrderId, 'DELIVERING', 'READY');
    await expectDeliveryStatusPatch(deliveredOrderId, 'DELIVERED', 'SERVED');

    const historyCount = await prisma.orderStatusHistory.count({ where: { orderId: deliveredOrderId } });
    expect(historyCount).toBeGreaterThanOrEqual(4);
  });

  it('P2-INT-04: cancel requires a reason', async () => {
    const orderRes = await createOnlineOrder();
    const orderId = orderRes.body.data.order.id;

    const res = await request(app)
      .patch(`/api/internal/delivery-orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryStatus: 'CANCELLED' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('REASON_REQUIRED');
  });

  it('P2-INT-05: delivered order is terminal', async () => {
    const res = await request(app)
      .patch(`/api/internal/delivery-orders/${deliveredOrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryStatus: 'PREPARING' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('P2-INT-06: store 1 admin cannot update store 2 delivery order', async () => {
    if (!branch2MenuItemId || !admin2Token) {
      console.warn('Skipping P2-INT-06: store 2 setup unavailable');
      return;
    }

    const res = await request(app)
      .post('/api/public/online-orders')
      .send({
        branchId: BRANCH_2,
        clientSessionId: `p2-store2-${crypto.randomUUID()}`,
        idempotencyKey: `p2-store2-${crypto.randomUUID()}`,
        items: [{ menuItemId: branch2MenuItemId, quantity: 1, selectedOptions: [] }],
        deliveryInfo: {
          customerName: 'Store Two Customer',
          phone: '0912345678',
          address: '456 Store Two Test Street',
          customerLat: 10.7295,
          customerLng: 106.7215,
          shippingFee: 12000,
        },
      });
    expect(res.status).toBe(201);
    store2OrderId = res.body.data.order.id;

    const forbidden = await request(app)
      .patch(`/api/internal/delivery-orders/${store2OrderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryStatus: 'PREPARING' });

    expect(forbidden.status).toBe(403);
  });

  it('P2-CONFIG-01: admin can update branch delivery config and kitchen cannot', async () => {
    const kitchenRes = await request(app)
      .patch(`/api/internal/branches/${BRANCH_1}/delivery-config`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ deliveryBaseFee: 16000 });
    expect(kitchenRes.status).toBe(403);

    const adminRes = await request(app)
      .patch(`/api/internal/branches/${BRANCH_1}/delivery-config`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryBaseFee: 17000 });

    expect(adminRes.status).toBe(200);
    expect(adminRes.body.data.deliveryBaseFee).toBe(17000);
  });

  async function findSimpleActiveMenuItem(branchId: string) {
    const item = await prisma.menuItem.findFirst({
      where: {
        category: { branchId },
        status: 'ACTIVE',
        optionGroups: { none: { isRequired: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    if (!item) throw new Error(`No simple active menu item for ${branchId}`);
    return item.id;
  }

  async function ensureBranch2TestMenuItem() {
    const category = await prisma.category.upsert({
      where: { id: 'cat-p2-test-branch2' },
      update: { branchId: BRANCH_2, status: 'ACTIVE' },
      create: {
        id: 'cat-p2-test-branch2',
        branchId: BRANCH_2,
        name: 'Phase 2 Test Category',
        sortOrder: 99,
        status: 'ACTIVE',
      },
    });

    const item = await prisma.menuItem.upsert({
      where: { id: 'item-p2-test-branch2' },
      update: {
        categoryId: category.id,
        name: 'Phase 2 Store 2 Test Item',
        price: 42000,
        status: 'ACTIVE',
      },
      create: {
        id: 'item-p2-test-branch2',
        categoryId: category.id,
        name: 'Phase 2 Store 2 Test Item',
        price: 42000,
        shortDescription: 'Seeded by phase 2 API tests',
        tagsJson: [],
        status: 'ACTIVE',
        sortOrder: 99,
      },
    });

    return item.id;
  }

  function baseDeliveryInfo(overrides: Record<string, unknown> = {}) {
    return {
      customerName: 'Phase Two Customer',
      phone: '0912345678',
      address: '123 Phase Two Test Street',
      ward: 'Ben Nghe',
      district: 'Quan 1',
      customerLat: NEAR_CUSTOMER.customerLat,
      customerLng: NEAR_CUSTOMER.customerLng,
      shippingFee: 15000,
      note: 'Phase 2 automated test',
      ...overrides,
    };
  }

  async function createOnlineOrder(overrides: Record<string, unknown> = {}) {
    const idempotencyKey = (overrides.idempotencyKey as string | undefined) ?? `p2-${crypto.randomUUID()}`;
    const itemId = (overrides.menuItemId as string | undefined) ?? menuItemId;
    const quantity = (overrides.quantity as number | undefined) ?? 1;
    const deliveryInfo = baseDeliveryInfo({
      phone: overrides.phone ?? '0912345678',
      customerLat: overrides.customerLat ?? NEAR_CUSTOMER.customerLat,
      customerLng: overrides.customerLng ?? NEAR_CUSTOMER.customerLng,
      shippingFee: overrides.shippingFee ?? 15000,
    });

    return request(app)
      .post('/api/public/online-orders')
      .send({
        branchId: BRANCH_1,
        clientSessionId: `p2-session-${crypto.randomUUID()}`,
        idempotencyKey,
        items: [{ menuItemId: itemId, quantity, selectedOptions: [] }],
        deliveryInfo,
      });
  }

  async function expectDeliveryStatusPatch(
    orderId: string,
    deliveryStatus: 'PREPARING' | 'DELIVERING' | 'DELIVERED',
    expectedOrderStatus: 'PREPARING' | 'READY' | 'SERVED'
  ) {
    const res = await request(app)
      .patch(`/api/internal/delivery-orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ deliveryStatus });

    expect(res.status).toBe(200);
    expect(res.body.data.deliveryStatus).toBe(deliveryStatus);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { deliveryInfo: true },
    });
    expect(order?.status).toBe(expectedOrderStatus);
    expect(order?.deliveryInfo?.deliveryStatus).toBe(deliveryStatus);
  }
});
