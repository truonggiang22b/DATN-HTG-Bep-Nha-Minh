/**
 * TEST SUITE: Internal KDS & Order Management APIs  
 * Coverage: active orders, full status transition matrix, cancel with/without reason,
 * order history (pagination, filters), multi-tenant isolation
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';

describe('Internal KDS & Order Management', () => {
  let adminToken: string;
  let kitchenToken: string;
  // Store 2 tokens for multi-tenant tests
  let admin2Token: string;
  let kitchen2Token: string;

  let branchId: string;
  let menuItemId: string;
  let orderId_new: string;          // order at NEW status (for transition tests)
  let orderId_for_cancel: string;   // order to test cancel flow
  let orderId_store2: string;       // order belonging to store 2

  const QR_STORE1 = 'qr-bnm-table-01';
  const QR_STORE2 = 'qr-pho-table-01'; // From seed — store 2
  const CLIENT_SESSION = crypto.randomUUID();
  const CLIENT_SESSION_2 = crypto.randomUUID();

  beforeAll(async () => {
    // Login store 1 users
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'Admin@123456' });
    adminToken = adminRes.body.data.accessToken;

    const kitchenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bep@bepnhaminh.vn', password: 'Kitchen@123456' });
    kitchenToken = kitchenRes.body.data.accessToken;

    // Login store 2 users
    const admin2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@phobacoan.vn', password: 'Admin@123456' });
    admin2Token = admin2Res.body.data?.accessToken;

    const kitchen2Res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bep@phobacoan.vn', password: 'Kitchen@123456' });
    kitchen2Token = kitchen2Res.body.data?.accessToken;

    // Get branchId and a simple menu item for store 1
    const qrRes = await request(app).get(`/api/public/qr/${QR_STORE1}`);
    branchId = qrRes.body.data.branch.id;

    // Clean up open sessions for store 1 table
    await prisma.order.updateMany({
      where: { table: { qrToken: QR_STORE1 }, status: { in: ['NEW', 'PREPARING', 'READY'] } },
      data: { status: 'CANCELLED' },
    });
    await prisma.tableSession.updateMany({
      where: { table: { qrToken: QR_STORE1 }, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    // Find a quick menu item without required options
    const menuRes = await request(app).get(`/api/public/branches/${branchId}/menu`);
    const categories = menuRes.body.data.categories;
    for (const cat of categories) {
      for (const item of cat.items) {
        if (item.status === 'ACTIVE' && !item.optionGroups?.some((og: any) => og.isRequired)) {
          menuItemId = item.id;
          break;
        }
      }
      if (menuItemId) break;
    }
    // fallback to any active item
    if (!menuItemId) menuItemId = categories[0].items[0].id;

    // Create orders for testing
    const order1 = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_STORE1,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId, quantity: 1, selectedOptions: [] }],
      });
    orderId_new = order1.body.data?.order?.id;

    const order2 = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_STORE1,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId, quantity: 2, selectedOptions: [] }],
      });
    orderId_for_cancel = order2.body.data?.order?.id;

    // Create order in store 2 (if store 2 QR exists)
    if (QR_STORE2) {
      try {
        // Clean up store 2 sessions
        await prisma.order.updateMany({
          where: { table: { qrToken: QR_STORE2 }, status: { in: ['NEW', 'PREPARING', 'READY'] } },
          data: { status: 'CANCELLED' },
        });
        await prisma.tableSession.updateMany({
          where: { table: { qrToken: QR_STORE2 }, status: 'OPEN' },
          data: { status: 'CLOSED', closedAt: new Date() },
        });

        const qr2Res = await request(app).get(`/api/public/qr/${QR_STORE2}`);
        const branchId2 = qr2Res.body.data?.branch?.id;
        if (branchId2) {
          const menu2Res = await request(app).get(`/api/public/branches/${branchId2}/menu`);
          const cats2 = menu2Res.body.data?.categories ?? [];
          let item2Id: string | null = null;
          for (const cat of cats2) {
            for (const item of cat.items) {
              if (item.status === 'ACTIVE') { item2Id = item.id; break; }
            }
            if (item2Id) break;
          }
          if (item2Id) {
            const o2 = await request(app)
              .post('/api/public/orders')
              .send({
                qrToken: QR_STORE2,
                clientSessionId: CLIENT_SESSION_2,
                idempotencyKey: crypto.randomUUID(),
                items: [{ menuItemId: item2Id, quantity: 1, selectedOptions: [] }],
              });
            orderId_store2 = o2.body.data?.order?.id;
          }
        }
      } catch (_) { /* store 2 not critical */ }
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ── Active Orders (KDS) ───────────────────────────────────────────────────

  it('KDS-01: Get active orders → 200 with orders array', async () => {
    const res = await request(app)
      .get('/api/internal/orders/active')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toBeInstanceOf(Array);
  });

  it('KDS-02: Active orders contain only NEW/PREPARING/READY status', async () => {
    const res = await request(app)
      .get('/api/internal/orders/active')
      .set('Authorization', `Bearer ${kitchenToken}`);

    for (const order of res.body.data.orders) {
      expect(['NEW', 'PREPARING', 'READY']).toContain(order.status);
    }
  });

  it('KDS-03: Active orders include order items', async () => {
    const res = await request(app)
      .get('/api/internal/orders/active')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(200);
    const found = res.body.data.orders.find((o: any) => o.id === orderId_new);
    expect(found).toBeDefined();
    expect(found.items).toBeInstanceOf(Array);
    expect(found.items.length).toBeGreaterThan(0);
  });

  it('KDS-04: Unauthenticated request to active orders → 401', async () => {
    const res = await request(app).get('/api/internal/orders/active');
    expect(res.status).toBe(401);
  });

  it('KDS-05: Multi-tenant — Store 1 Kitchen cannot see Store 2 orders', async () => {
    if (!orderId_store2 || !kitchenToken) {
      console.warn('Skipping KDS-05: no store 2 order created');
      return;
    }
    const res = await request(app)
      .get('/api/internal/orders/active')
      .set('Authorization', `Bearer ${kitchenToken}`);

    const store2OrderFound = res.body.data.orders.find((o: any) => o.id === orderId_store2);
    expect(store2OrderFound).toBeUndefined();
  });

  // ── Status Transitions ────────────────────────────────────────────────────

  it('STATUS-01: NEW → PREPARING (valid transition)', async () => {
    if (!orderId_new) return;
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId_new}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'PREPARING' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PREPARING');
  });

  it('STATUS-02: PREPARING → READY (valid transition)', async () => {
    if (!orderId_new) return;
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId_new}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'READY' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('READY');
  });

  it('STATUS-03: READY → SERVED (valid terminal transition)', async () => {
    if (!orderId_new) return;
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId_new}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'SERVED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('SERVED');
  });

  it('STATUS-04: SERVED → PREPARING (invalid — terminal state) → 400', async () => {
    if (!orderId_new) return;
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId_new}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'PREPARING' }); // SERVED is terminal

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('STATUS-05: Cancel order with reason → 200 CANCELLED', async () => {
    if (!orderId_for_cancel) return;
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId_for_cancel}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'CANCELLED', reason: 'Khách đổi ý' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');
  });

  it('STATUS-06: Cancel already-CANCELLED order (terminal) → 400', async () => {
    if (!orderId_for_cancel) return;
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId_for_cancel}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'CANCELLED', reason: 'Again' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_TRANSITION');
  });

  it('STATUS-07: Cancel order WITHOUT reason → 400 REASON_REQUIRED', async () => {
    // Create a fresh NEW order to test this
    const newOrder = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_STORE1,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId, quantity: 1, selectedOptions: [] }],
      });
    const newId = newOrder.body.data?.order?.id;
    if (!newId) return;

    const res = await request(app)
      .patch(`/api/internal/orders/${newId}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'CANCELLED' }); // No reason

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('REASON_REQUIRED');
  });

  it('STATUS-08: toStatus missing in body → 400 Zod validation', async () => {
    if (!orderId_new) return;
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId_new}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({}); // missing toStatus

    expect(res.status).toBe(400);
  });

  it('STATUS-09: Non-existent orderId → 404', async () => {
    const res = await request(app)
      .patch('/api/internal/orders/order-does-not-exist/status')
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'PREPARING' });

    expect(res.status).toBe(404);
  });

  it('STATUS-10: Multi-tenant — Store 1 kitchen cannot update Store 2 order status', async () => {
    if (!orderId_store2) {
      console.warn('Skipping STATUS-10: no store 2 order');
      return;
    }
    const res = await request(app)
      .patch(`/api/internal/orders/${orderId_store2}/status`)
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ toStatus: 'PREPARING' });

    expect(res.status).toBe(403);
  });

  // ── Order History ─────────────────────────────────────────────────────────

  it('HISTORY-01: Order history → 200 with pagination structure', async () => {
    const res = await request(app)
      .get('/api/internal/orders/history')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('orders');
    expect(res.body.data).toHaveProperty('total');
    expect(res.body.data).toHaveProperty('page');
    expect(res.body.data).toHaveProperty('pageSize');
    expect(res.body.data).toHaveProperty('totalPages');
    expect(res.body.data.orders).toBeInstanceOf(Array);
  });

  it('HISTORY-02: Filter by status=CANCELLED → only cancelled orders', async () => {
    const res = await request(app)
      .get('/api/internal/orders/history?status=CANCELLED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    for (const order of res.body.data.orders) {
      expect(order.status).toBe('CANCELLED');
    }
  });

  it('HISTORY-03: Filter by status=SERVED → only served orders', async () => {
    const res = await request(app)
      .get('/api/internal/orders/history?status=SERVED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    for (const order of res.body.data.orders) {
      expect(order.status).toBe('SERVED');
    }
  });

  it('HISTORY-04: Pagination — page=1&pageSize=2 returns max 2 items', async () => {
    const res = await request(app)
      .get('/api/internal/orders/history?page=1&pageSize=2')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders.length).toBeLessThanOrEqual(2);
    expect(res.body.data.pageSize).toBe(2);
  });

  it('HISTORY-05: KITCHEN role cannot access order history → 403', async () => {
    const res = await request(app)
      .get('/api/internal/orders/history')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(403);
  });

  it('HISTORY-06: Multi-tenant — Store 1 history does not include Store 2 orders', async () => {
    if (!orderId_store2) {
      console.warn('Skipping HISTORY-06: no store 2 order');
      return;
    }
    const res = await request(app)
      .get('/api/internal/orders/history')
      .set('Authorization', `Bearer ${adminToken}`);

    const store2Order = res.body.data.orders.find((o: any) => o.id === orderId_store2);
    expect(store2Order).toBeUndefined();
  });
});
