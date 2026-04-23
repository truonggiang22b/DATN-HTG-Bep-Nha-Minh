import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';

describe('End-to-End System Test: Bếp Nhà Mình Backend API', () => {
  let adminToken: string;
  let kitchenToken: string;
  let tableId: string;
  let branchId: string;
  let clientSessionId: string;
  let orderId: string;
  let idempotencyKey: string;
  let menuItemId: string;
  let testOptionGroupId: string | null = null;
  let testOptionId: string | null = null;
  let testOptionName: string | null = null;
  let testOptionPriceDelta: number = 0;

  // table-03 dedicated to e2e suite; table-01=public.test, table-02=sessions.test
  const qrToken = 'qr-bnm-table-03';

  // Helper to build valid order items for any menu item (handles required options)
  const buildValidItems = (qty = 1) => [
    {
      menuItemId,
      quantity: qty,
      selectedOptions: testOptionGroupId
        ? [
            {
              optionGroupId: testOptionGroupId,
              optionId: testOptionId,
              name: testOptionName,
              priceDelta: testOptionPriceDelta,
            },
          ]
        : [],
      note: 'Không hành',
    },
  ];

  beforeAll(async () => {
    // Force-cleanup ALL leftover sessions/orders from previous test runs on table-01
    await prisma.order.updateMany({
      where: {
        table: { qrToken: qrToken },
        status: { in: ['NEW', 'PREPARING', 'READY'] },
      },
      data: { status: 'CANCELLED' },
    });
    await prisma.tableSession.updateMany({
      where: { table: { qrToken: qrToken }, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    // Also cancel any orders on the branchId scope that might interfere
    // (other test suites create orders on table-01)
    const tableRecord = await prisma.diningTable.findFirst({ where: { qrToken: qrToken } });
    if (tableRecord) {
      await prisma.order.updateMany({
        where: { tableId: tableRecord.id, status: { in: ['NEW', 'PREPARING', 'READY'] } },
        data: { status: 'CANCELLED' },
      });
    }


    // Resolve QR
    const qrRes = await request(app).get(`/api/public/qr/${qrToken}`);
    expect(qrRes.status).toBe(200);
    tableId = qrRes.body.data.table.id;
    branchId = qrRes.body.data.branch.id;
    clientSessionId = crypto.randomUUID();

    // Fetch menu — find first ACTIVE item (incl. optionGroups)
    const menuRes = await request(app).get(`/api/public/branches/${branchId}/menu`);
    expect(menuRes.status).toBe(200);
    const categories = menuRes.body.data.categories;
    const firstCategoryWithItems = categories.find((c: any) => c.items.length > 0);
    const firstItem = firstCategoryWithItems.items.find((i: any) => i.status === 'ACTIVE');
    menuItemId = firstItem.id;

    // Try to find a non-required-option item for simpler testing
    for (const cat of categories) {
      for (const item of cat.items) {
        if (item.status !== 'ACTIVE') continue;
        const hasRequired = item.optionGroups?.some((og: any) => og.isRequired);
        if (!hasRequired) {
          menuItemId = item.id;
          testOptionGroupId = null;
          testOptionId = null;
          testOptionName = null;
          testOptionPriceDelta = 0;
          break;
        } else if (item.optionGroups?.length > 0) {
          // Fall back: pick valid option
          menuItemId = item.id;
          testOptionGroupId = item.optionGroups[0].id;
          testOptionId = item.optionGroups[0].options[0].id;
          testOptionName = item.optionGroups[0].options[0].name;
          testOptionPriceDelta = item.optionGroups[0].options[0].priceDelta ?? 0;
        }
      }
      if (!testOptionGroupId) break; // found non-required item
    }

    // Login Admin
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'Admin@123456' });
    expect(adminLoginRes.status).toBe(200);
    adminToken = adminLoginRes.body.data.accessToken;

    // Login Kitchen
    const kitchenLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bep@bepnhaminh.vn', password: 'Kitchen@123456' });
    expect(kitchenLoginRes.status).toBe(200);
    kitchenToken = kitchenLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ──────────────────────── PUBLIC FLOW ────────────────────────

  it('1. Should resolve QR code', async () => {
    const res = await request(app).get(`/api/public/qr/${qrToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.table.tableCode).toBe('table-03');
    expect(res.body.data.branch).toHaveProperty('id');
    expect(res.body.data.store).toHaveProperty('name');
  });

  it('2. Should fetch menu with categories and items', async () => {
    const res = await request(app).get(`/api/public/branches/${branchId}/menu`);
    expect(res.status).toBe(200);
    expect(res.body.data.categories).toBeInstanceOf(Array);
    expect(res.body.data.categories.length).toBeGreaterThan(0);
    // Each category should have items
    const catWithItems = res.body.data.categories.find((c: any) => c.items?.length > 0);
    expect(catWithItems).toBeDefined();
  });

  it('3. Should create a new order (returns 201)', async () => {
    idempotencyKey = crypto.randomUUID();
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken,
        clientSessionId,
        idempotencyKey,
        customerNote: 'E2E Test Note',
        items: buildValidItems(2),
      });

    if (res.status !== 201) {
      throw new Error(`Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
    expect(res.body.data.order).toHaveProperty('id');
    expect(res.body.data.order.status).toBe('NEW');
    orderId = res.body.data.order.id;
  });

  it('4. Idempotent re-submission returns same order (200)', async () => {
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken,
        clientSessionId,
        idempotencyKey, // Same key — triggers idempotency path
        customerNote: 'Changed note — should be ignored',
        items: buildValidItems(3), // Different qty but valid — should be ignored
      });

    expect(res.status).toBe(200);
    expect(res.body.data.order.id).toBe(orderId);
  });

  it('5. Kitchen can fetch active orders and sees the new order', async () => {
    const res = await request(app)
      .get('/api/internal/orders/active')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(200);
    const found = res.body.data.orders.find((o: any) => o.id === orderId);
    expect(found).toBeDefined();
    expect(found.status).toBe('NEW');
  });

  // ──────────────────────── STATUS TRANSITIONS ────────────────────────

  it('6. Kitchen transitions order: NEW → PREPARING', async () => {
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'PREPARING' }); // ← correct field name

    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
    expect(res.body.data.status).toBe('PREPARING');
  });

  it('7. Invalid transition PREPARING → NEW is blocked (validation error)', async () => {
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'NEW' }); // NEW is not in enum — Zod rejects it

    expect(res.status).toBe(400); // VALIDATION_ERROR from Zod (NEW not in allowed enum)
    expect(res.body.error.code).toMatch(/VALIDATION_ERROR|INVALID_TRANSITION/);
  });

  it('8. Kitchen can transition: PREPARING → READY → SERVED', async () => {
    // PREPARING → READY
    let res = await request(app)
      .patch(`/api/internal/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'READY' });
    if (res.status !== 200) {
      throw new Error(`READY transition failed: ${JSON.stringify(res.body)}`);
    }
    expect(res.body.data.status).toBe('READY');

    // READY → SERVED
    res = await request(app)
      .patch(`/api/internal/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'SERVED' });
    if (res.status !== 200) {
      throw new Error(`SERVED transition failed: ${JSON.stringify(res.body)}`);
    }
    expect(res.body.data.status).toBe('SERVED');
  });

  // ──────────────────────── SESSION RESET ────────────────────────

  it('9. Session reset is blocked when active orders exist', async () => {
    // Create a fresh active order
    const dummyIdemp = crypto.randomUUID();
    const orderRes = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken,
        clientSessionId,
        idempotencyKey: dummyIdemp,
        items: buildValidItems(1),
      });
    if (orderRes.status !== 201) {
      throw new Error(`Dummy order creation failed: ${JSON.stringify(orderRes.body)}`);
    }
    const dummyOrderId = orderRes.body.data.order.id;

    // Try to reset session → should be blocked
    const resetRes = await request(app)
      .post(`/api/internal/tables/${tableId}/reset-session`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resetRes.status).toBe(409);
    expect(resetRes.body.error.code).toBe('SESSION_HAS_ACTIVE_ORDERS');

    // Cleanup: cancel the dummy order so test 10 can proceed
    await request(app)
      .patch(`/api/internal/orders/${dummyOrderId}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'CANCELLED', reason: 'Test cleanup' });
  });

  it('10. Admin can reset session after all orders are SERVED/CANCELLED', async () => {
    const res = await request(app)
      .post(`/api/internal/tables/${tableId}/reset-session`)
      .set('Authorization', `Bearer ${adminToken}`);

    if (res.status !== 200) {
      throw new Error(`Reset session failed: ${JSON.stringify(res.body)}`);
    }
    expect(res.body.data.closedSession.status).toBe('CLOSED');
    expect(res.body.data.closedSession).toHaveProperty('id');
  });
});
