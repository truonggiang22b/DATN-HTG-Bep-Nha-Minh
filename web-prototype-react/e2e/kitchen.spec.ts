/**
 * E2E Tests — Role: KITCHEN (KDS)
 * Selectors lấy từ KDSPage.tsx, constants.ts
 *
 * KDS labels (KDS_STATUS_LABELS): NEW='Mới nhận', PREPARING='Đang chuẩn bị', READY='Sẵn sàng', SERVED='Đã phục vụ'
 * KDS CTA labels (KDS_CTA_LABELS): NEW='Bắt đầu chuẩn bị', PREPARING='Sẵn sàng', READY='Đã phục vụ'
 * Class card: kds-card, kds-card--new, kds-card--preparing, kds-card--ready, kds-card--served
 * Class btn:  kds-btn-primary, kds-btn-cancel
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { ACCOUNTS, loginAndNavigate, uiLogin } from './helpers/auth';

const BASE = 'http://localhost:5173';
const API  = 'http://localhost:3001';

const QR_TABLE01 = 'qr-bnm-table-01';

// ─── Helper: tạo đơn qua API ─────────────────────────────────────────────────

async function createOrder(request: APIRequestContext): Promise<{ orderId: string; orderCode: string }> {
  const qrRes = await request.get(`${API}/api/public/qr/${QR_TABLE01}`);
  const qrData = (await qrRes.json()).data;

  const menuRes = await request.get(`${API}/api/public/menu?branchId=${qrData.branch.id}`);
  const items = (await menuRes.json()).data.categories
    .flatMap((c: any) => c.items)
    .filter((i: any) => i.status === 'ACTIVE');

  if (!items.length) throw new Error('Không có món ACTIVE');

  const res = await request.post(`${API}/api/public/orders`, {
    data: {
      qrToken: QR_TABLE01,
      clientSessionId: `kds-test-${Date.now()}`,
      idempotencyKey: `kds-idem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      items: [{ menuItemId: items[0].id, quantity: 1, selectedOptions: [] }],
    },
  });
  const { data } = await res.json();
  return { orderId: data.id, orderCode: data.orderCode };
}

async function getKitchenToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/internal/auth/login`, {
    data: { email: ACCOUNTS.kitchen.email, password: ACCOUNTS.kitchen.password },
  });
  const json = await res.json();
  return json.data?.accessToken ?? json.data?.token;
}

async function moveToStatus(request: APIRequestContext, orderId: string, token: string, toStatus: string) {
  const res = await request.patch(`${API}/api/internal/orders/${orderId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { toStatus },
  });
  expect(res.ok()).toBeTruthy();
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 1 — Đăng nhập KDS
// ─────────────────────────────────────────────────────────────────────────────

test.describe('KITCHEN — Đăng nhập', () => {

  test('TC-K01: Login KITCHEN qua UI → redirect /kds', async ({ page }) => {
    await uiLogin(page, ACCOUNTS.kitchen.email, ACCOUNTS.kitchen.password);
    await expect(page).toHaveURL(`${BASE}/kds`, { timeout: 10_000 });

    // Header - từ KDSPage.tsx: className="kds-header__brand" text="🍜 Bếp Nhà Mình — Bếp"
    await expect(page.locator('.kds-header__brand')).toContainText('Bếp Nhà Mình');
    await expect(page.locator('.kds-header__brand')).toContainText('Bếp');

    // Clock - className="kds-header__clock"
    await expect(page.locator('.kds-header__clock')).toBeVisible();
  });

  test('TC-K02: KITCHEN không thể truy cập /admin → redirect /login', async ({ page }) => {
    await loginAndNavigate(page, 'kitchen', '/admin');
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 5000 });
  });

  test('TC-K03: Đăng xuất KDS → về /login', async ({ page }) => {
    await loginAndNavigate(page, 'kitchen', '/kds');

    // Nút logout: text "Đăng xuất"
    await page.locator('button', { hasText: 'Đăng xuất' }).click();
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 5000 });

    // Truy cập /kds lại phải redirect
    await page.goto(`${BASE}/kds`);
    await expect(page).toHaveURL(`${BASE}/login`, { timeout: 5000 });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Block 2 — KDS Board Layout
// ─────────────────────────────────────────────────────────────────────────────

test.describe('KITCHEN — KDS Board', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page, 'kitchen', '/kds');
    await expect(page.locator('.kds-board')).toBeVisible({ timeout: 10_000 });
  });

  test('TC-K04: KDS board có đủ 4 cột', async ({ page }) => {
    const cols = page.locator('.kds-column');
    await expect(cols).toHaveCount(4);

    // Tiêu đề cột — KDS_STATUS_LABELS: NEW='Mới nhận', PREPARING='Đang chuẩn bị', READY='Sẵn sàng', SERVED='Đã phục vụ'
    const titles = await page.locator('.kds-column__title').allTextContents();
    expect(titles).toContain('Mới nhận');
    expect(titles).toContain('Đang chuẩn bị');
    expect(titles).toContain('Sẵn sàng');
    expect(titles).toContain('Đã phục vụ');
  });

  test('TC-K05: Đơn mới tự xuất hiện trên KDS sau polling (5s)', async ({ page, request }) => {
    const newCol = page.locator('.kds-column').first(); // Cột "Mới nhận"
    const countBefore = await newCol.locator('.kds-card').count();

    // Tạo đơn qua API
    const { orderCode } = await createOrder(request);

    // Đợi KDS poll (5s + buffer)
    await page.waitForTimeout(6500);

    // Card mới xuất hiện
    const countAfter = await newCol.locator('.kds-card').count();
    expect(countAfter).toBeGreaterThan(countBefore);

    // Đúng orderCode
    await expect(newCol.locator('.kds-card__code', { hasText: orderCode })).toBeVisible({ timeout: 3000 });
  });

  test('TC-K06: Card đơn hàng hiển thị đúng thông tin', async ({ page, request }) => {
    const { orderCode } = await createOrder(request);
    await page.waitForTimeout(6500);

    const newCol = page.locator('.kds-column').first();
    const card = newCol.locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(card).toBeVisible({ timeout: 5000 });

    // Kiểm tra các phần tử trong card (từ KDSOrderCard)
    await expect(card.locator('.kds-card__table')).toBeVisible(); // Tên bàn
    await expect(card.locator('.kds-card__code')).toContainText(orderCode);
    await expect(card.locator('.kds-card__time')).toBeVisible();  // elapsed time
    await expect(card.locator('.kds-card__items')).toBeVisible(); // danh sách món

    // CTA button: 'Bắt đầu chuẩn bị' (KDS_CTA_LABELS.NEW)
    await expect(card.locator('.kds-btn-primary')).toContainText('Bắt đầu chuẩn bị');

    // Nút hủy
    await expect(card.locator('.kds-btn-cancel')).toBeVisible();
    await expect(card.locator('.kds-btn-cancel')).toContainText('Hủy');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Block 3 — State Machine
// ─────────────────────────────────────────────────────────────────────────────

test.describe('KITCHEN — State Machine', () => {

  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page, 'kitchen', '/kds');
    await expect(page.locator('.kds-board')).toBeVisible({ timeout: 10_000 });
  });

  test('TC-K07: NEW → PREPARING khi bấm "Bắt đầu chuẩn bị"', async ({ page, request }) => {
    const { orderCode } = await createOrder(request);
    await page.waitForTimeout(6500);

    // Tìm card ở cột Mới nhận
    const newCol = page.locator('.kds-column').first();
    const card = newCol.locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(card).toBeVisible({ timeout: 8000 });

    // Bấm CTA: 'Bắt đầu chuẩn bị'
    await card.locator('.kds-btn-primary').click();

    // Toast: "{orderCode} → Đang chuẩn bị"
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast').first()).toContainText(orderCode);

    // Card chuyển sang cột "Đang chuẩn bị" (cột index 1)
    await page.waitForTimeout(6500);
    const preparingCol = page.locator('.kds-column').nth(1);
    await expect(
      preparingCol.locator('.kds-card__code', { hasText: orderCode })
    ).toBeVisible({ timeout: 8000 });
  });

  test('TC-K08: PREPARING → READY khi bấm "Sẵn sàng"', async ({ page, request }) => {
    const { orderId, orderCode } = await createOrder(request);
    const token = await getKitchenToken(request);

    // NEW → PREPARING qua API
    await moveToStatus(request, orderId, token, 'PREPARING');
    await page.waitForTimeout(6500);

    // Card ở cột "Đang chuẩn bị"
    const preparingCol = page.locator('.kds-column').nth(1);
    const card = preparingCol.locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(card).toBeVisible({ timeout: 8000 });

    // Bấm "Sẵn sàng" (KDS_CTA_LABELS.PREPARING)
    await card.locator('.kds-btn-primary').click();

    // Toast
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Card sang cột "Sẵn sàng" (cột index 2)
    await page.waitForTimeout(6500);
    const readyCol = page.locator('.kds-column').nth(2);
    await expect(
      readyCol.locator('.kds-card__code', { hasText: orderCode })
    ).toBeVisible({ timeout: 8000 });
  });

  test('TC-K09: READY → SERVED khi bấm "Đã phục vụ"', async ({ page, request }) => {
    const { orderId, orderCode } = await createOrder(request);
    const token = await getKitchenToken(request);

    await moveToStatus(request, orderId, token, 'PREPARING');
    await moveToStatus(request, orderId, token, 'READY');
    await page.waitForTimeout(6500);

    // Card ở cột "Sẵn sàng"
    const readyCol = page.locator('.kds-column').nth(2);
    const card = readyCol.locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(card).toBeVisible({ timeout: 8000 });

    // Bấm "Đã phục vụ" (KDS_CTA_LABELS.READY)
    await card.locator('.kds-btn-primary').click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Card sang cột "Đã phục vụ" (cột index 3)
    await page.waitForTimeout(6500);
    const servedCol = page.locator('.kds-column').nth(3);
    await expect(
      servedCol.locator('.kds-card__code', { hasText: orderCode })
    ).toBeVisible({ timeout: 8000 });

    // Card SERVED không có CTA button (vì KDS_CTA_LABELS không có SERVED)
    const servedCard = servedCol.locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(servedCard.locator('.kds-btn-primary')).toHaveCount(0);
  });

  test('TC-K10: Hủy đơn ở trạng thái NEW', async ({ page, request }) => {
    const { orderCode } = await createOrder(request);
    await page.waitForTimeout(6500);

    const newCol = page.locator('.kds-column').first();
    const card = newCol.locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(card).toBeVisible({ timeout: 8000 });

    // Đăng ký dialog listener TRƯỚC khi click
    page.on('dialog', (dialog) => dialog.accept());

    // Bấm hủy — KDSPage dùng window.confirm
    await card.locator('.kds-btn-cancel').click();

    // Toast: "{orderCode} đã hủy"
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.toast').first()).toContainText('đã hủy');

    // Card biến mất khỏi cột NEW sau poll
    await page.waitForTimeout(6500);
    await expect(
      newCol.locator('.kds-card__code', { hasText: orderCode })
    ).toHaveCount(0, { timeout: 5000 });
  });

  test('TC-K11: Full flow: NEW → PREPARING → READY → SERVED qua KDS UI', async ({ page, request }) => {
    const { orderCode } = await createOrder(request);
    await page.waitForTimeout(6500);

    // Step 1: NEW → PREPARING
    let card = page.locator('.kds-column').first().locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(card).toBeVisible({ timeout: 8000 });
    await card.locator('.kds-btn-primary').click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Step 2: PREPARING → READY
    await page.waitForTimeout(6500);
    card = page.locator('.kds-column').nth(1).locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(card).toBeVisible({ timeout: 8000 });
    await card.locator('.kds-btn-primary').click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Step 3: READY → SERVED
    await page.waitForTimeout(6500);
    card = page.locator('.kds-column').nth(2).locator('.kds-card').filter({
      has: page.locator('.kds-card__code', { hasText: orderCode }),
    });
    await expect(card).toBeVisible({ timeout: 8000 });
    await card.locator('.kds-btn-primary').click();
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Cuối: card ở cột SERVED
    await page.waitForTimeout(6500);
    const servedCol = page.locator('.kds-column').nth(3);
    await expect(
      servedCol.locator('.kds-card__code', { hasText: orderCode })
    ).toBeVisible({ timeout: 8000 });
  });

  test('TC-K12: Counter header cập nhật sau khi tạo đơn mới', async ({ page, request }) => {
    await createOrder(request);
    await page.waitForTimeout(6500);

    // Header meta: "{n} đơn mới • {m} đang làm • ..."
    const metaText = await page.locator('.kds-header__meta').textContent();
    expect(metaText).toMatch(/\d+ đơn mới/);
    expect(metaText).toMatch(/\d+ đang làm/);
    expect(metaText).toMatch(/\d+ hoàn thành/);
  });

});
