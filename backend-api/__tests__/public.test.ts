/**
 * TEST SUITE: Public Customer APIs
 * Coverage: QR resolution, menu fetch, order creation (+ validation), tracking, SOLD_OUT guard
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import crypto from 'crypto';

describe('Public Customer APIs', () => {
  let branchId: string;
  let tableId: string;
  let menuItemId: string;         // item WITHOUT required options
  let soldOutItemId: string;
  let requiredOptItemId: string;
  let reqOptGroupId: string;
  let reqOptOptionId: string;
  let reqOptOptionName: string;
  let createdOrderId: string;

  const QR_VALID = 'qr-bnm-table-01';
  const QR_INVALID = 'qr-does-not-exist-xyz';
  const CLIENT_SESSION = crypto.randomUUID();

  beforeAll(async () => {
    // Clean up leftover open sessions for table-01
    await prisma.order.updateMany({
      where: { table: { qrToken: QR_VALID }, status: { in: ['NEW', 'PREPARING', 'READY'] } },
      data: { status: 'CANCELLED' },
    });
    await prisma.tableSession.updateMany({
      where: { table: { qrToken: QR_VALID }, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    // Resolve QR to get branchId + tableId
    const qrRes = await request(app).get(`/api/public/qr/${QR_VALID}`);
    branchId = qrRes.body.data.branch.id;
    tableId = qrRes.body.data.table.id;

    // Parse menu to find items for test scenarios
    const menuRes = await request(app).get(`/api/public/branches/${branchId}/menu`);
    const categories = menuRes.body.data.categories;

    for (const cat of categories) {
      for (const item of cat.items) {
        if (item.status !== 'ACTIVE') continue;
        const hasRequired = item.optionGroups?.some((og: any) => og.isRequired);

        if (!hasRequired && !menuItemId) {
          menuItemId = item.id; // Simple item — no required options
        }
        if (hasRequired && !requiredOptItemId) {
          requiredOptItemId = item.id;
          reqOptGroupId = item.optionGroups[0].id;
          reqOptOptionId = item.optionGroups[0].options[0].id;
          reqOptOptionName = item.optionGroups[0].options[0].name;
        }
      }
    }

    // Fallback: if all items have required options, use the first ACTIVE one
    if (!menuItemId) {
      const firstCat = categories.find((c: any) => c.items?.length > 0);
      menuItemId = firstCat.items[0].id;
    }

    // Create a temporary SOLD_OUT item for testing
    const soldOutItem = await prisma.menuItem.findFirst({
      where: { category: { branchId }, status: 'SOLD_OUT' },
    });
    if (soldOutItem) {
      soldOutItemId = soldOutItem.id;
    } else {
      // Temporarily mark a menu item as SOLD_OUT for this test
      const tempItem = await prisma.menuItem.findFirst({
        where: { category: { branchId }, status: 'ACTIVE', id: { not: menuItemId } },
      });
      if (tempItem) {
        await prisma.menuItem.update({ where: { id: tempItem.id }, data: { status: 'SOLD_OUT' } });
        soldOutItemId = tempItem.id;
      }
    }
  });

  afterAll(async () => {
    // Restore SOLD_OUT item if we set it
    if (soldOutItemId) {
      await prisma.menuItem.update({
        where: { id: soldOutItemId },
        data: { status: 'ACTIVE' },
      }).catch(() => { /* ignore if already cleaned */ });
    }
    await prisma.$disconnect();
  });

  // ── QR Resolution ─────────────────────────────────────────────────────────

  it('QR-01: Valid QR token → 200 with table/branch/store info', async () => {
    const res = await request(app).get(`/api/public/qr/${QR_VALID}`);
    expect(res.status).toBe(200);
    expect(res.body.data.table.tableCode).toBe('table-01');
    expect(res.body.data.branch).toHaveProperty('id');
    expect(res.body.data.store).toHaveProperty('name');
  });

  it('QR-02: Invalid QR token → 404', async () => {
    const res = await request(app).get(`/api/public/qr/${QR_INVALID}`);
    expect(res.status).toBe(404);
  });

  it('QR-03: Response includes activeSession field (null if no session)', async () => {
    const res = await request(app).get(`/api/public/qr/${QR_VALID}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('activeSession'); // null or object
  });

  // ── Menu ──────────────────────────────────────────────────────────────────

  it('MENU-01: Valid branchId → 200 with categories and items', async () => {
    const res = await request(app).get(`/api/public/branches/${branchId}/menu`);
    expect(res.status).toBe(200);
    expect(res.body.data.categories).toBeInstanceOf(Array);
    expect(res.body.data.categories.length).toBeGreaterThan(0);
  });

  it('MENU-02: Each category has name and items array', async () => {
    const res = await request(app).get(`/api/public/branches/${branchId}/menu`);
    for (const cat of res.body.data.categories) {
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('items');
      expect(cat.items).toBeInstanceOf(Array);
    }
  });

  it('MENU-03: HIDDEN items are excluded from public menu', async () => {
    const res = await request(app).get(`/api/public/branches/${branchId}/menu`);
    for (const cat of res.body.data.categories) {
      for (const item of cat.items) {
        expect(item.status).not.toBe('HIDDEN');
      }
    }
  });

  it('MENU-04: Invalid branchId → 404', async () => {
    const res = await request(app).get('/api/public/branches/branch-does-not-exist/menu');
    expect(res.status).toBe(404);
  });

  // ── Order Creation ────────────────────────────────────────────────────────

  it('ORDER-01: Valid order → 201 with orderCode and NEW status', async () => {
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        customerNote: 'Test note',
        items: [{ menuItemId, quantity: 1, selectedOptions: [] }],
      });

    if (res.status !== 201) throw new Error(JSON.stringify(res.body));
    expect(res.body.data.order.status).toBe('NEW');
    expect(res.body.data.order).toHaveProperty('orderCode');
    expect(res.body.data.order).toHaveProperty('tableSessionId');
    createdOrderId = res.body.data.order.id;
  });

  it('ORDER-02: Idempotent submission with same key → 200 returns same order', async () => {
    const key = crypto.randomUUID();
    // First submission
    const first = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: key,
        items: [{ menuItemId, quantity: 1, selectedOptions: [] }],
      });
    expect(first.status).toBe(201);

    // Duplicate submission with same key
    const second = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: key,
        items: [{ menuItemId, quantity: 5, selectedOptions: [] }], // different qty — ignored
      });
    expect(second.status).toBe(200);
    expect(second.body.data.order.id).toBe(first.body.data.order.id);
  });

  it('ORDER-03: Empty cart → 400 validation error', async () => {
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [],
      });
    expect(res.status).toBe(400);
  });

  it('ORDER-04: Invalid QR token in order → 400/404', async () => {
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_INVALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId, quantity: 1, selectedOptions: [] }],
      });
    expect([400, 404]).toContain(res.status);
  });

  it('ORDER-05: Missing idempotencyKey → 400 validation error', async () => {
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        items: [{ menuItemId, quantity: 1, selectedOptions: [] }],
      });
    expect(res.status).toBe(400);
  });

  it('ORDER-06: Item quantity 0 → 400 validation error', async () => {
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId, quantity: 0, selectedOptions: [] }],
      });
    expect(res.status).toBe(400);
  });

  it('ORDER-07: Item quantity > 50 → 400 validation error', async () => {
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId, quantity: 51, selectedOptions: [] }],
      });
    expect(res.status).toBe(400);
  });

  it('ORDER-08: SOLD_OUT item → 409 ITEM_SOLD_OUT', async () => {
    if (!soldOutItemId) {
      console.warn('No SOLD_OUT item available — skipping ORDER-08');
      return;
    }
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId: soldOutItemId, quantity: 1, selectedOptions: [] }],
      });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ITEM_SOLD_OUT');
  });

  it('ORDER-09: Required option not provided → 400 INVALID_OPTION', async () => {
    if (!requiredOptItemId) {
      console.warn('No required-option item available — skipping ORDER-09');
      return;
    }
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId: requiredOptItemId, quantity: 1, selectedOptions: [] }], // empty options
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_OPTION');
  });

  it('ORDER-10: Non-existent menuItemId → 400 INVALID_ITEM', async () => {
    const res = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken: QR_VALID,
        clientSessionId: CLIENT_SESSION,
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId: 'item-does-not-exist', quantity: 1, selectedOptions: [] }],
      });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ITEM');
  });

  // ── Order Tracking ────────────────────────────────────────────────────────

  it('TRACK-01: Valid orderId → 200 with status and items', async () => {
    if (!createdOrderId) return;
    const res = await request(app).get(`/api/public/orders/${createdOrderId}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('orderCode');
    expect(res.body.data).toHaveProperty('internalStatus');
    expect(res.body.data).toHaveProperty('customerStatus'); // localized label
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('TRACK-02: Valid orderId with matching qrToken → 200', async () => {
    if (!createdOrderId) return;
    const res = await request(app).get(
      `/api/public/orders/${createdOrderId}?qrToken=${QR_VALID}`
    );
    expect(res.status).toBe(200);
  });

  it('TRACK-03: Valid orderId with WRONG qrToken → 403 Forbidden', async () => {
    if (!createdOrderId) return;
    const res = await request(app).get(
      `/api/public/orders/${createdOrderId}?qrToken=wrong-qr-token`
    );
    expect(res.status).toBe(403);
  });

  it('TRACK-04: Non-existent orderId → 404', async () => {
    const res = await request(app).get('/api/public/orders/order-does-not-exist-xyz');
    expect(res.status).toBe(404);
  });
});
