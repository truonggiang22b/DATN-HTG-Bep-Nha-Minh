/**
 * TEST SUITE: Admin CRUD — Categories, Menu Items, Tables
 * Coverage: list, create, update for all 3 resources + RBAC enforcement
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';

describe('Admin CRUD — Categories, Menu Items, Tables', () => {
  let adminToken: string;
  let kitchenToken: string;
  let managerToken: string | null = null;
  let createdCategoryId: string;
  let createdMenuItemId: string;
  let createdTableId: string;
  let branchId: string;
  let existingCategoryId: string;

  beforeAll(async () => {
    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'Admin@123456' });
    adminToken = adminRes.body.data.accessToken;
    branchId = adminRes.body.data.user.branchId;

    // Login Kitchen
    const kitchenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bep@bepnhaminh.vn', password: 'Kitchen@123456' });
    kitchenToken = kitchenRes.body.data.accessToken;

    // Get an existing category for menu item tests
    const catRes = await request(app)
      .get('/api/internal/categories')
      .set('Authorization', `Bearer ${adminToken}`);
    existingCategoryId = catRes.body.data.categories[0]?.id;
  });

  afterAll(async () => {
    // Cleanup created test data
    try {
      if (createdMenuItemId) await prisma.menuItem.delete({ where: { id: createdMenuItemId } });
      if (createdCategoryId) await prisma.category.delete({ where: { id: createdCategoryId } });
      if (createdTableId) await prisma.diningTable.delete({ where: { id: createdTableId } });
    } catch (_) { /* ignore */ }
    await prisma.$disconnect();
  });

  // ── Categories ─────────────────────────────────────────────────────────────

  it('CAT-01: List categories (ADMIN) → 200 with array', async () => {
    const res = await request(app)
      .get('/api/internal/categories')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.categories).toBeInstanceOf(Array);
    expect(res.body.data.categories.length).toBeGreaterThan(0);
  });

  it('CAT-02: KITCHEN cannot list categories → 403', async () => {
    const res = await request(app)
      .get('/api/internal/categories')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(403);
  });

  it('CAT-03: Create new category (ADMIN) → 201 with category object', async () => {
    const res = await request(app)
      .post('/api/internal/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Category E2E', sortOrder: 99 });

    expect(res.status).toBe(201);
    expect(res.body.data.category.name).toBe('Test Category E2E');
    expect(res.body.data.category).toHaveProperty('id');
    createdCategoryId = res.body.data.category.id;
  });

  it('CAT-04: Create category with empty name → 400', async () => {
    const res = await request(app)
      .post('/api/internal/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' });

    expect(res.status).toBe(400);
  });

  it('CAT-05: KITCHEN cannot create categories → 403', async () => {
    const res = await request(app)
      .post('/api/internal/categories')
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ name: 'Hack' });

    expect(res.status).toBe(403);
  });

  it('CAT-06: Update category name → 200 with updated name', async () => {
    if (!createdCategoryId) return;
    const res = await request(app)
      .patch(`/api/internal/categories/${createdCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Category E2E - Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.category.name).toBe('Test Category E2E - Updated');
  });

  it('CAT-07: Update non-existent category → 404', async () => {
    const res = await request(app)
      .patch('/api/internal/categories/cat-does-not-exist')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Whatever' });

    expect(res.status).toBe(404);
  });

  it('CAT-08: Update category status to HIDDEN → 200', async () => {
    if (!createdCategoryId) return;
    const res = await request(app)
      .patch(`/api/internal/categories/${createdCategoryId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'HIDDEN' });

    expect(res.status).toBe(200);
    expect(res.body.data.category.status).toBe('HIDDEN');
  });

  // ── Menu Items ─────────────────────────────────────────────────────────────

  it('ITEM-01: List menu items (ADMIN) → 200 with items array', async () => {
    const res = await request(app)
      .get('/api/internal/menu-items')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeInstanceOf(Array);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('ITEM-02: KITCHEN cannot list menu items → 403', async () => {
    const res = await request(app)
      .get('/api/internal/menu-items')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(403);
  });

  it('ITEM-03: Create new menu item (ADMIN) → 201', async () => {
    if (!existingCategoryId) return;
    const res = await request(app)
      .post('/api/internal/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: existingCategoryId,
        name: 'E2E Test Dish',
        price: 75000,
        shortDescription: 'Món test',
        tags: ['test'],
        sortOrder: 99,
      });

    if (res.status !== 201) throw new Error(JSON.stringify(res.body));
    expect(res.body.data.item.name).toBe('E2E Test Dish');
    expect(res.body.data.item.price).toBe(75000);
    expect(res.body.data.item.status).toBe('ACTIVE');
    createdMenuItemId = res.body.data.item.id;
  });

  it('ITEM-04: Create item with price < 0 → 400', async () => {
    if (!existingCategoryId) return;
    const res = await request(app)
      .post('/api/internal/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: existingCategoryId,
        name: 'Negative Price',
        price: -100,
      });

    expect(res.status).toBe(400);
  });

  it('ITEM-05: Create item with categoryId from another store → 403', async () => {
    // Try to create item using store 2 category ID (cross-tenant attack)
    const store2Cat = await prisma.category.findFirst({
      where: { branch: { store: { name: { not: 'Bếp Nhà Mình' } } } },
    });
    if (!store2Cat) {
      console.warn('Skipping ITEM-05: no cross-store category available');
      return;
    }
    const res = await request(app)
      .post('/api/internal/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId: store2Cat.id,
        name: 'Cross-tenant Attack',
        price: 50000,
      });

    expect(res.status).toBe(403);
  });

  it('ITEM-06: Update menu item name and price → 200', async () => {
    if (!createdMenuItemId) return;
    const res = await request(app)
      .patch(`/api/internal/menu-items/${createdMenuItemId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E Test Dish - Updated', price: 85000 });

    expect(res.status).toBe(200);
    expect(res.body.data.item.name).toBe('E2E Test Dish - Updated');
    expect(res.body.data.item.price).toBe(85000);
  });

  it('ITEM-07: Mark item as SOLD_OUT → 200', async () => {
    if (!createdMenuItemId) return;
    const res = await request(app)
      .patch(`/api/internal/menu-items/${createdMenuItemId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SOLD_OUT' });

    expect(res.status).toBe(200);
    expect(res.body.data.item.status).toBe('SOLD_OUT');
  });

  it('ITEM-08: Mark item back to ACTIVE → 200', async () => {
    if (!createdMenuItemId) return;
    const res = await request(app)
      .patch(`/api/internal/menu-items/${createdMenuItemId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.item.status).toBe('ACTIVE');
  });

  it('ITEM-09: Invalid status value → 400', async () => {
    if (!createdMenuItemId) return;
    const res = await request(app)
      .patch(`/api/internal/menu-items/${createdMenuItemId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DELETED' }); // not a valid enum

    expect(res.status).toBe(400);
  });

  it('ITEM-10: SOLD_OUT item → public menu shows it as sold out', async () => {
    if (!createdMenuItemId) return;
    // Mark as SOLD_OUT
    await request(app)
      .patch(`/api/internal/menu-items/${createdMenuItemId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SOLD_OUT' });

    // Check it appears in public menu as SOLD_OUT (not filtered out)
    const menuRes = await request(app)
      .get(`/api/public/branches/${branchId}/menu`);
    let found = false;
    for (const cat of menuRes.body.data.categories) {
      const item = cat.items.find((i: any) => i.id === createdMenuItemId);
      if (item) { expect(item.status).toBe('SOLD_OUT'); found = true; break; }
    }
    expect(found).toBe(true);

    // Restore to ACTIVE
    await request(app)
      .patch(`/api/internal/menu-items/${createdMenuItemId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });
  });

  it('ITEM-11: HIDDEN item → public menu omits it entirely', async () => {
    if (!createdMenuItemId) return;
    // Mark as HIDDEN
    await request(app)
      .patch(`/api/internal/menu-items/${createdMenuItemId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'HIDDEN' });

    // Check it does NOT appear in public menu
    const menuRes = await request(app).get(`/api/public/branches/${branchId}/menu`);
    let found = false;
    for (const cat of menuRes.body.data.categories) {
      if (cat.items.find((i: any) => i.id === createdMenuItemId)) { found = true; break; }
    }
    expect(found).toBe(false);

    // Restore
    await request(app)
      .patch(`/api/internal/menu-items/${createdMenuItemId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' });
  });

  // ── Tables ─────────────────────────────────────────────────────────────────

  it('TABLE-01: List tables (ADMIN) → 200 with tables array', async () => {
    const res = await request(app)
      .get('/api/internal/tables')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tables).toBeInstanceOf(Array);
    expect(res.body.data.tables.length).toBeGreaterThan(0);
  });

  it('TABLE-02: Table list includes qrToken and hasActiveSession', async () => {
    const res = await request(app)
      .get('/api/internal/tables')
      .set('Authorization', `Bearer ${adminToken}`);

    const table = res.body.data.tables[0];
    expect(table).toHaveProperty('qrToken');
    expect(table).toHaveProperty('hasActiveSession');
    expect(table).toHaveProperty('tableCode');
    expect(table).toHaveProperty('status');
  });

  it('TABLE-03: KITCHEN can list tables', async () => {
    const res = await request(app)
      .get('/api/internal/tables')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(200);
  });

  it('TABLE-04: Create new table (ADMIN) → 201 with auto-generated qrToken', async () => {
    const res = await request(app)
      .post('/api/internal/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ tableCode: 'test-e2e-table', displayName: 'Bàn Test E2E' });

    expect(res.status).toBe(201);
    expect(res.body.data.table).toHaveProperty('qrToken');
    expect(res.body.data.table.qrToken).toMatch(/^qr-/);
    expect(res.body.data.table.status).toBe('ACTIVE');
    createdTableId = res.body.data.table.id;
  });

  it('TABLE-05: KITCHEN cannot create tables → 403', async () => {
    const res = await request(app)
      .post('/api/internal/tables')
      .set('Authorization', `Bearer ${kitchenToken}`)
      .send({ tableCode: 'hack-table', displayName: 'Hack' });

    expect(res.status).toBe(403);
  });

  it('TABLE-06: Create table with missing tableCode → 400', async () => {
    const res = await request(app)
      .post('/api/internal/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ displayName: 'No Code' });

    expect(res.status).toBe(400);
  });

  it('TABLE-07: Update table displayName → 200', async () => {
    if (!createdTableId) return;
    const res = await request(app)
      .patch(`/api/internal/tables/${createdTableId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ displayName: 'Bàn Test E2E - Updated' });

    expect(res.status).toBe(200);
    expect(res.body.data.table.displayName).toBe('Bàn Test E2E - Updated');
  });

  it('TABLE-08: Deactivate table (set INACTIVE) → 200', async () => {
    if (!createdTableId) return;
    const res = await request(app)
      .patch(`/api/internal/tables/${createdTableId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INACTIVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.table.status).toBe('INACTIVE');
  });

  it('TABLE-09: Deactivated table QR returns 404 for customers', async () => {
    if (!createdTableId) return;
    // Get the qrToken of the deactivated table
    const tableData = await prisma.diningTable.findUnique({ where: { id: createdTableId } });
    if (!tableData) return;

    const res = await request(app).get(`/api/public/qr/${tableData.qrToken}`);
    expect(res.status).toBe(404);
  });

  it('TABLE-10: Update non-existent table → 404', async () => {
    const res = await request(app)
      .patch('/api/internal/tables/table-does-not-exist')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ displayName: 'Ghost' });

    expect(res.status).toBe(404);
  });
});
