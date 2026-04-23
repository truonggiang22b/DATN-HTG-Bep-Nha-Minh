import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import crypto from 'crypto';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { supabaseAdmin } from '../src/lib/supabase';

describe('Admin Cleanup & Staff Management', () => {
  let adminToken: string;
  let kitchenToken: string;
  let branchId: string;
  let storeId: string;

  const createdCategoryIds: string[] = [];
  const createdMenuItemIds: string[] = [];
  const createdTableIds: string[] = [];
  const createdUserEmails: string[] = [];

  beforeAll(async () => {
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@bepnhaminh.vn', password: 'Admin@123456' });

    adminToken = adminRes.body.data.accessToken;
    branchId = adminRes.body.data.user.branchId;
    storeId = adminRes.body.data.user.storeId;

    const kitchenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bep@bepnhaminh.vn', password: 'Kitchen@123456' });

    kitchenToken = kitchenRes.body.data.accessToken;
  });

  afterAll(async () => {
    for (const email of createdUserEmails) {
      try {
        const user = await prisma.user.findFirst({
          where: { email },
          include: { roles: true },
        });

        if (!user) continue;

        await prisma.userRole_Rel.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
        await supabaseAdmin.auth.admin.deleteUser(user.supabaseAuthUserId);
      } catch {
        // Best-effort cleanup to avoid masking test failures.
      }
    }

    if (createdTableIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { order: { tableId: { in: createdTableIds } } },
      });
      await prisma.orderStatusHistory.deleteMany({
        where: { order: { tableId: { in: createdTableIds } } },
      });
      await prisma.order.deleteMany({
        where: { tableId: { in: createdTableIds } },
      });
      await prisma.tableSession.deleteMany({
        where: { tableId: { in: createdTableIds } },
      });
      await prisma.diningTable.deleteMany({
        where: { id: { in: createdTableIds } },
      });
    }

    if (createdMenuItemIds.length > 0) {
      await prisma.menuItem.deleteMany({
        where: { id: { in: createdMenuItemIds } },
      });
    }

    if (createdCategoryIds.length > 0) {
      await prisma.category.deleteMany({
        where: { id: { in: createdCategoryIds } },
      });
    }

    await prisma.$disconnect();
  });

  it('CLEAN-CAT-01: deleteCategory hides category and cascades child items to HIDDEN', async () => {
    const suffix = Date.now();

    const categoryRes = await request(app)
      .post('/api/internal/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Cleanup Category ${suffix}`, sortOrder: 90 });

    expect(categoryRes.status).toBe(201);
    const categoryId = categoryRes.body.data.category.id as string;
    createdCategoryIds.push(categoryId);

    const activeItemRes = await request(app)
      .post('/api/internal/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId,
        name: `Cleanup Active ${suffix}`,
        price: 55000,
        shortDescription: 'Hidden by category cleanup',
      });

    expect(activeItemRes.status).toBe(201);
    const activeItemId = activeItemRes.body.data.item.id as string;
    createdMenuItemIds.push(activeItemId);

    const soldOutItemRes = await request(app)
      .post('/api/internal/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId,
        name: `Cleanup SoldOut ${suffix}`,
        price: 65000,
        shortDescription: 'Will be hidden too',
      });

    expect(soldOutItemRes.status).toBe(201);
    const soldOutItemId = soldOutItemRes.body.data.item.id as string;
    createdMenuItemIds.push(soldOutItemId);

    const soldOutStatusRes = await request(app)
      .patch(`/api/internal/menu-items/${soldOutItemId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'SOLD_OUT' });

    expect(soldOutStatusRes.status).toBe(200);

    const deleteRes = await request(app)
      .delete(`/api/internal/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.hiddenItemsCount).toBe(2);

    const hiddenCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { status: true },
    });

    expect(hiddenCategory?.status).toBe('HIDDEN');

    const childItems = await prisma.menuItem.findMany({
      where: { id: { in: [activeItemId, soldOutItemId] } },
      select: { id: true, status: true },
    });

    expect(childItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: activeItemId, status: 'HIDDEN' }),
        expect.objectContaining({ id: soldOutItemId, status: 'HIDDEN' }),
      ]),
    );

    const restoreRes = await request(app)
      .patch(`/api/internal/categories/${categoryId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.category.status).toBe('ACTIVE');

    const restoredItems = await prisma.menuItem.findMany({
      where: { id: { in: [activeItemId, soldOutItemId] } },
      select: { status: true },
    });

    expect(restoredItems.every((item) => item.status === 'HIDDEN')).toBe(true);
  });

  it('CLEAN-ITEM-01: restoreMenuItem rejects when parent category is still HIDDEN', async () => {
    const suffix = Date.now() + 1;

    const categoryRes = await request(app)
      .post('/api/internal/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Hidden Parent ${suffix}`, sortOrder: 91 });

    expect(categoryRes.status).toBe(201);
    const categoryId = categoryRes.body.data.category.id as string;
    createdCategoryIds.push(categoryId);

    const itemRes = await request(app)
      .post('/api/internal/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId,
        name: `Hidden Child ${suffix}`,
        price: 49000,
      });

    expect(itemRes.status).toBe(201);
    const itemId = itemRes.body.data.item.id as string;
    createdMenuItemIds.push(itemId);

    const deleteCategoryRes = await request(app)
      .delete(`/api/internal/categories/${categoryId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteCategoryRes.status).toBe(200);

    const restoreItemRes = await request(app)
      .patch(`/api/internal/menu-items/${itemId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreItemRes.status).toBe(400);
    expect(restoreItemRes.body.error.code).toBe('CATEGORY_HIDDEN');
  });

  it('CLEAN-ITEM-02: deleteMenuItem hides it and public menu no longer shows it', async () => {
    const suffix = Date.now() + 2;

    const categoryRes = await request(app)
      .post('/api/internal/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Public Menu Category ${suffix}`, sortOrder: 92 });

    expect(categoryRes.status).toBe(201);
    const categoryId = categoryRes.body.data.category.id as string;
    createdCategoryIds.push(categoryId);

    const itemRes = await request(app)
      .post('/api/internal/menu-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        categoryId,
        name: `Public Hidden Item ${suffix}`,
        price: 61000,
      });

    expect(itemRes.status).toBe(201);
    const itemId = itemRes.body.data.item.id as string;
    createdMenuItemIds.push(itemId);

    const deleteRes = await request(app)
      .delete(`/api/internal/menu-items/${itemId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.item.status).toBe('HIDDEN');

    const publicMenuRes = await request(app)
      .get(`/api/public/branches/${branchId}/menu`);

    const found = publicMenuRes.body.data.categories.some((category: any) =>
      category.items.some((item: any) => item.id === itemId),
    );

    expect(found).toBe(false);
  });

  it('CLEAN-TABLE-01: deactivate and restore table via new routes changes public QR availability', async () => {
    const suffix = Date.now();

    const createRes = await request(app)
      .post('/api/internal/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableCode: `cleanup-table-${suffix}`,
        displayName: `Bàn Cleanup ${suffix}`,
      });

    expect(createRes.status).toBe(201);
    const tableId = createRes.body.data.table.id as string;
    const qrToken = createRes.body.data.table.qrToken as string;
    createdTableIds.push(tableId);

    const activeQrRes = await request(app).get(`/api/public/qr/${qrToken}`);
    expect(activeQrRes.status).toBe(200);

    const deactivateRes = await request(app)
      .delete(`/api/internal/tables/${tableId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.table.status).toBe('INACTIVE');

    const inactiveQrRes = await request(app).get(`/api/public/qr/${qrToken}`);
    expect(inactiveQrRes.status).toBe(404);

    const restoreRes = await request(app)
      .patch(`/api/internal/tables/${tableId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.table.status).toBe('ACTIVE');

    const restoredQrRes = await request(app).get(`/api/public/qr/${qrToken}`);
    expect(restoredQrRes.status).toBe(200);
  });

  it('CLEAN-TABLE-02: deactivateTable is blocked when table still has an OPEN session', async () => {
    const suffix = Date.now() + 1;

    const createRes = await request(app)
      .post('/api/internal/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableCode: `guard-open-session-${suffix}`,
        displayName: `Bàn Guard Session ${suffix}`,
      });

    expect(createRes.status).toBe(201);
    const tableId = createRes.body.data.table.id as string;
    createdTableIds.push(tableId);

    await prisma.tableSession.create({
      data: {
        tableId,
        status: 'OPEN',
      },
    });

    const deactivateRes = await request(app)
      .delete(`/api/internal/tables/${tableId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deactivateRes.status).toBe(400);
    expect(deactivateRes.body.error.code).toBe('TABLE_HAS_OPEN_SESSION');
  });

  it('CLEAN-TABLE-03: deactivateTable is blocked when table still has active orders', async () => {
    const suffix = Date.now() + 2;

    const createRes = await request(app)
      .post('/api/internal/tables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tableCode: `guard-active-order-${suffix}`,
        displayName: `Bàn Guard Order ${suffix}`,
      });

    expect(createRes.status).toBe(201);
    const tableId = createRes.body.data.table.id as string;
    const qrToken = createRes.body.data.table.qrToken as string;
    createdTableIds.push(tableId);

    const menuRes = await request(app).get(`/api/public/branches/${branchId}/menu`);
    let menuItemId: string | undefined;
    for (const category of menuRes.body.data.categories) {
      const candidate = category.items.find(
        (item: any) => item.status === 'ACTIVE' && !item.optionGroups?.some((group: any) => group.isRequired),
      );
      if (candidate) {
        menuItemId = candidate.id;
        break;
      }
    }

    expect(menuItemId).toBeTruthy();

    const orderRes = await request(app)
      .post('/api/public/orders')
      .send({
        qrToken,
        clientSessionId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId, quantity: 1, selectedOptions: [] }],
      });

    expect(orderRes.status).toBe(201);

    await prisma.tableSession.updateMany({
      where: { tableId, status: 'OPEN' },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    const deactivateRes = await request(app)
      .delete(`/api/internal/tables/${tableId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deactivateRes.status).toBe(400);
    expect(deactivateRes.body.error.code).toBe('TABLE_HAS_ACTIVE_ORDER');
  });

  it('STAFF-01: KITCHEN cannot access staff management endpoints', async () => {
    const res = await request(app)
      .get('/api/internal/users')
      .set('Authorization', `Bearer ${kitchenToken}`);

    expect(res.status).toBe(403);
  });

  it('STAFF-02: ADMIN can create, list, update, and deactivate a staff account', async () => {
    const suffix = Date.now();
    const email = `staff+${suffix}@bepnhaminh.vn`;
    const password = `TempPass!${suffix}`;
    createdUserEmails.push(email);

    const createRes = await request(app)
      .post('/api/internal/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        displayName: `Nhân viên Test ${suffix}`,
        email,
        role: 'KITCHEN',
        temporaryPassword: password,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.user.email).toBe(email);
    expect(createRes.body.data.user.roles).toEqual(['KITCHEN']);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.roles).toContain('KITCHEN');

    const listRes = await request(app)
      .get('/api/internal/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.users.some((user: any) => user.email === email)).toBe(true);

    const userId = createRes.body.data.user.id as string;

    const updateRes = await request(app)
      .patch(`/api/internal/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        displayName: `Quản lý Test ${suffix}`,
        role: 'MANAGER',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.user.displayName).toBe(`Quản lý Test ${suffix}`);
    expect(updateRes.body.data.user.roles).toEqual(['MANAGER']);

    const deactivateRes = await request(app)
      .patch(`/api/internal/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(deactivateRes.status).toBe(200);
    expect(deactivateRes.body.data.user.isActive).toBe(false);

    const blockedLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(blockedLoginRes.status).toBe(401);
  });

  it('STAFF-03: duplicate email in the same store is rejected', async () => {
    const suffix = Date.now() + 1;
    const email = `duplicate+${suffix}@bepnhaminh.vn`;
    const password = `TempPass!${suffix}`;
    createdUserEmails.push(email);

    const firstCreateRes = await request(app)
      .post('/api/internal/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        displayName: `Duplicate A ${suffix}`,
        email,
        role: 'KITCHEN',
        temporaryPassword: password,
      });

    expect(firstCreateRes.status).toBe(201);

    const duplicateRes = await request(app)
      .post('/api/internal/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        displayName: `Duplicate B ${suffix}`,
        email,
        role: 'MANAGER',
        temporaryPassword: password,
      });

    expect(duplicateRes.status).toBe(400);
    expect(duplicateRes.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('STAFF-04: admin cannot lock their own account', async () => {
    const me = await prisma.user.findFirst({
      where: {
        storeId,
        email: 'admin@bepnhaminh.vn',
      },
    });

    expect(me).toBeTruthy();

    const res = await request(app)
      .patch(`/api/internal/users/${me!.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_LOCK_SELF');
  });
});
