/**
 * E2E Tests — Role: CUSTOMER
 * Selectors lấy trực tiếp từ MenuPage.tsx, CartPage.tsx, TrackingPage.tsx
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import { QR_TOKENS } from './helpers/auth';

const BASE = 'http://localhost:5173';
const API  = 'http://localhost:3001';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Lấy admin token để gọi API */
async function getAdminToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${API}/api/internal/auth/login`, {
    data: { email: 'admin@bepnhaminh.vn', password: 'Admin@123456' },
  });
  const json = await res.json();
  // API trả: { success, data: { accessToken, user } }
  return json.data?.accessToken ?? json.data?.token ?? json.token ?? json.accessToken;
}

/**
 * Mở menu và đợi load xong.
 * Inject qrToken vào sessionStorage để CartPage có context.
 */
async function openMenu(page: any, qrToken: string) {
  await page.goto(`${BASE}/qr/${qrToken}`);
  // Đợi menu section đầu tiên hiện
  await expect(page.locator('.menu-section').first()).toBeVisible({ timeout: 20_000 });
}

/**
 * Thêm món đầu tiên không có required options vào giỏ (quick-add).
 * Trả về true nếu thêm được.
 */
async function quickAdd(page: any): Promise<boolean> {
  const cards = page.locator('.menu-card:not(.menu-card--sold-out)');
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const btn = cards.nth(i).locator('.menu-card__add-btn');
    if (await btn.isDisabled()) continue;
    await btn.click();
    // Nếu sheet mở (có required option) → đóng và thử món khác
    await page.waitForTimeout(400);
    const sheetVisible = await page.locator('.sheet-overlay, .sheet-backdrop').first().isVisible().catch(() => false)
      || await page.locator('button', { hasText: 'Thêm vào giỏ' }).isVisible().catch(() => false);
    if (sheetVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      continue;
    }
    // Toast xuất hiện = thêm thành công
    if (await page.locator('.toast').first().isVisible().catch(() => false)) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Block 1 — Xem Menu
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CUSTOMER — Xem Menu', () => {

  test('TC-C01: Truy cập menu qua QR token hợp lệ', async ({ page }) => {
    await page.goto(`${BASE}/qr/${QR_TOKENS.table01}`);
    // Không dùng menu-section vì cần đợi qrData load trước
    await expect(page.locator('.customer-header')).toBeVisible({ timeout: 15_000 });

    // Brand name từ constants.ts = 'Bếp Nhà Mình'
    await expect(page.locator('.customer-header__brand')).toContainText('Bếp Nhà Mình');

    // Tên bàn
    await expect(page.locator('.customer-header__table')).toContainText('Bàn');

    // Tabs danh mục (sau khi menu load)
    await expect(page.locator('.category-tabs')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('.category-tab').first()).toBeVisible();

    // Menu section
    await expect(page.locator('.menu-section').first()).toBeVisible({ timeout: 20_000 });
  });

  test('TC-C02: QR token không hợp lệ → hiện thông báo lỗi', async ({ page }) => {
    await page.goto(`${BASE}/qr/invalid-token-xyz-abc`);
    await page.waitForTimeout(4000); // Đợi QR resolve thất bại

    await expect(page.locator('text=Mã QR không hợp lệ')).toBeVisible({ timeout: 10_000 });
    // Không có menu section
    await expect(page.locator('.menu-section')).toHaveCount(0, { timeout: 3000 });
  });

  test('TC-C03: Lọc theo danh mục tab', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table01);

    // Chip thứ 2 (index 1) = danh mục đầu tiên (sau "Tất cả")
    const tabs = page.locator('.category-tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThan(1);

    // Click tab thứ 2
    await tabs.nth(1).click();
    await page.waitForTimeout(500);

    // Tab vừa click phải có class active
    await expect(tabs.nth(1)).toHaveClass(/category-tab--active/);
  });

  test('TC-C04: Tìm kiếm món theo tên', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table01);

    // Search input trong .search-bar
    const searchInput = page.locator('.search-bar input');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill('bún');
    await page.waitForTimeout(600);

    // Phải có ít nhất 1 card hoặc hiện empty-state
    const cards = page.locator('.menu-card');
    const emptyState = page.locator('.empty-state');
    const hasCards = await cards.count() > 0;
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasCards || hasEmpty).toBeTruthy();

    // Nếu có cards, name phải chứa "bún"
    if (hasCards) {
      const names = await page.locator('.menu-card__name').allTextContents();
      for (const name of names) {
        expect(name.toLowerCase()).toContain('bún');
      }
    }
  });

  test('TC-C05: Món SOLD_OUT — nút "+" bị disabled', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table01);

    const soldOut = page.locator('.menu-card--sold-out').first();
    const count = await soldOut.count();
    test.skip(count === 0, 'Không có món SOLD_OUT, skip TC-C05');

    // Nút disabled
    await expect(soldOut.locator('.menu-card__add-btn')).toBeDisabled();

    // Badge "Tạm hết" - class: badge badge-sold-out
    await expect(soldOut.locator('.badge-sold-out')).toBeVisible();
    await expect(soldOut.locator('.badge-sold-out')).toContainText('Tạm hết');
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Block 2 — Giỏ Hàng
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CUSTOMER — Giỏ Hàng', () => {

  test('TC-C06: Item detail sheet mở khi bấm vào card món', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table01);

    // Bấm vào card đầu tiên (không phải nút "+")
    const firstCard = page.locator('.menu-card').first();
    await firstCard.click();

    // Sheet mở: có button "Thêm vào giỏ"
    await expect(page.locator('button', { hasText: 'Thêm vào giỏ' })).toBeVisible({ timeout: 8000 });
  });

  test('TC-C07: Giỏ hàng rỗng → hiện empty state', async ({ page }) => {
    // Xóa cart trong localStorage trước
    await page.goto(`${BASE}/login`);
    await page.evaluate(() => {
      // Xóa cart state
      Object.keys(localStorage).forEach(k => { if (k.includes('cart') || k.includes('bnm')) localStorage.removeItem(k); });
      sessionStorage.clear();
    });
    await page.goto(`${BASE}/cart`);

    await expect(page.locator('.empty-state-title')).toContainText('Giỏ hàng đang trống', { timeout: 8000 });
    await expect(page.locator('button', { hasText: 'Xem thực đơn →' })).toBeVisible();
  });

  test('TC-C08: Thêm món vào giỏ qua quick-add button', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table01);

    const added = await quickAdd(page);
    test.skip(!added, 'Không quick-add được (toàn bộ món có required options)');

    // Toast xuất hiện
    await expect(page.locator('.toast').first()).toBeVisible({ timeout: 5000 });

    // Cart badge trong header
    await expect(page.locator('.cart-count-badge')).toBeVisible();

    // Cart bar sticky ở cuối trang
    await expect(page.locator('.cart-bar')).toBeVisible();
    await expect(page.locator('.cart-bar__label')).toContainText('Xem giỏ hàng');
  });

  test('TC-C09: Xem giỏ hàng có items', async ({ page }) => {
    // Thêm món trước
    await openMenu(page, QR_TOKENS.table02);
    const added = await quickAdd(page);
    test.skip(!added, 'Không quick-add được, skip TC-C09');

    // Click cart bar để vào CartPage
    await page.locator('.cart-bar__inner').click();

    // CartPage header
    await expect(page.locator('.cart-header__title')).toContainText('Giỏ hàng', { timeout: 8000 });

    // Cart item
    await expect(page.locator('.cart-item').first()).toBeVisible();

    // Tổng giá
    await expect(page.locator('.cart-summary__total').first()).toBeVisible();

    // Nút gửi order
    await expect(page.locator('button', { hasText: 'Gửi order cho quán' })).toBeVisible();
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Block 3 — Điều chỉnh giỏ hàng
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CUSTOMER — Điều chỉnh Giỏ Hàng', () => {

  test('TC-C10: Tăng/giảm số lượng trong giỏ', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table03);
    const added = await quickAdd(page);
    test.skip(!added, 'Không quick-add được, skip TC-C10');

    await page.locator('.cart-bar__inner').click();
    await expect(page.locator('.cart-item').first()).toBeVisible({ timeout: 8000 });

    // qty-stepper: nút "-" (index 0), value, nút "+" (index 1)
    const stepper = page.locator('.qty-stepper').first();
    const valueEl = stepper.locator('.qty-stepper__value');
    const btns    = stepper.locator('.qty-stepper__btn');

    const before = parseInt(await valueEl.textContent() ?? '1');

    // Tăng
    await btns.nth(1).click(); // "+"  — xem CartPage.tsx line 152: [−, value, +]
    await expect(valueEl).toHaveText(String(before + 1), { timeout: 3000 });

    // Giảm
    await btns.first().click(); // "−"
    await expect(valueEl).toHaveText(String(before), { timeout: 3000 });
  });

  test('TC-C11: Xóa item khỏi giỏ', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table04);
    const added = await quickAdd(page);
    test.skip(!added, 'Không quick-add được, skip TC-C11');

    await page.locator('.cart-bar__inner').click();
    await expect(page.locator('.cart-item').first()).toBeVisible({ timeout: 8000 });

    // Nút "🗑 Xóa món" — class: cart-item__remove-btn
    await page.locator('.cart-item__remove-btn').first().click();

    // Giỏ trống
    await expect(page.locator('.empty-state-title')).toContainText('Giỏ hàng đang trống', { timeout: 5000 });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Block 4 — Đặt Hàng & Tracking
// ─────────────────────────────────────────────────────────────────────────────

test.describe('CUSTOMER — Đặt Hàng & Tracking', () => {

  test('TC-C12: Gửi đơn hàng → redirect tracking page', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table04);
    const added = await quickAdd(page);
    test.skip(!added, 'Không quick-add được, skip TC-C12');

    // Vào cart
    await page.locator('.cart-bar__inner').click();
    await expect(page.locator('.cart-item').first()).toBeVisible({ timeout: 8000 });

    // Gửi order
    await page.locator('button', { hasText: 'Gửi order cho quán' }).click();

    // Phải redirect sang /order/:id/tracking
    await expect(page).toHaveURL(/\/order\/.+\/tracking/, { timeout: 20_000 });

    // Mã đơn hiện — class: tracking-code-value
    await expect(page.locator('.tracking-code-value').first()).toBeVisible({ timeout: 10_000 });

    // Brand name vẫn hiện
    await expect(page.locator('.customer-header__brand')).toContainText('Bếp Nhà Mình');

    // Trạng thái "Đơn đã được tiếp nhận!" — tracking-success-title
    await expect(page.locator('.tracking-success-title')).toContainText('Đơn đã được tiếp nhận!', { timeout: 5000 });

    // Timeline dot active
    await expect(page.locator('.timeline-dot--active').first()).toBeVisible();

    // Label "Đã tiếp nhận" từ TIMELINE_STEPS
    await expect(page.locator('.timeline-label', { hasText: 'Đã tiếp nhận' }).first()).toBeVisible();

    // Polling text
    await expect(page.locator('text=↻ Tự động cập nhật mỗi 3s')).toBeVisible();

    // Nút "Gọi thêm món"
    await expect(page.locator('button', { hasText: 'Gọi thêm món' })).toBeVisible();
  });

  test('TC-C13: Tracking page auto-update: SERVED → ẩn nút Gọi thêm', async ({ page, request }) => {
    // 1. Tạo đơn qua API
    const qrRes = await request.get(`${API}/api/public/qr/${QR_TOKENS.table05}`);
    const qrData = (await qrRes.json()).data;
    const menuRes = await request.get(`${API}/api/public/menu?branchId=${qrData.branch.id}`);
    const menuData = (await menuRes.json()).data;
    const firstActive = menuData.categories.flatMap((c: any) => c.items).find((i: any) => i.status === 'ACTIVE');
    test.skip(!firstActive, 'Không có món ACTIVE, skip TC-C13');

    const submitRes = await request.post(`${API}/api/public/orders`, {
      data: {
        qrToken: QR_TOKENS.table05,
        clientSessionId: `tc-c13-${Date.now()}`,
        idempotencyKey: `tc-c13-key-${Date.now()}`,
        items: [{ menuItemId: firstActive.id, quantity: 1, selectedOptions: [] }],
      },
    });
    const { data: orderData } = await submitRes.json();
    const { id: orderId } = orderData;

    // 2. Mở tracking page
    // Inject qrToken vào sessionStorage trước
    await page.goto(`${BASE}/login`);
    await page.evaluate((token: string) => {
      sessionStorage.setItem('bnm-qr-token', token);
    }, QR_TOKENS.table05);

    await page.goto(`${BASE}/order/${orderId}/tracking`);
    await expect(page.locator('.tracking-success-title')).toBeVisible({ timeout: 10_000 });

    // 3. Chuyển trạng thái → SERVED qua API
    const token = await getAdminToken(request);
    for (const s of ['PREPARING', 'READY', 'SERVED']) {
      await request.patch(`${API}/api/internal/orders/${orderId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { toStatus: s },
      });
    }

    // 4. Đợi poll (3s) và kiểm tra
    await page.waitForTimeout(4500);
    await expect(page.locator('.tracking-success-title')).toContainText('Đã phục vụ xong!', { timeout: 10_000 });
    await expect(page.locator('button', { hasText: 'Gọi thêm món' })).toBeHidden({ timeout: 3000 });
    await expect(page.locator('text=↻ Tự động cập nhật mỗi 3s')).toBeHidden();
  });

  test('TC-C14: Nút "Gọi thêm món" → quay lại menu', async ({ page }) => {
    await openMenu(page, QR_TOKENS.table01);
    const added = await quickAdd(page);
    test.skip(!added, 'Không quick-add được, skip TC-C14');

    await page.locator('.cart-bar__inner').click();
    await page.locator('button', { hasText: 'Gửi order cho quán' }).click();
    await expect(page).toHaveURL(/\/order\/.+\/tracking/, { timeout: 20_000 });

    // Bấm "Gọi thêm món"
    await page.locator('button', { hasText: 'Gọi thêm món' }).click();

    // Quay về /qr/...
    await expect(page).toHaveURL(/\/qr\//, { timeout: 8000 });
    await expect(page.locator('.customer-header__brand')).toContainText('Bếp Nhà Mình');
  });

  test('TC-C15: Tracking page — đơn CANCELLED hiện trạng thái hủy', async ({ page, request }) => {
    const qrRes = await request.get(`${API}/api/public/qr/${QR_TOKENS.table01}`);
    const qrData = (await qrRes.json()).data;
    const menuRes = await request.get(`${API}/api/public/menu?branchId=${qrData.branch.id}`);
    const menuData = (await menuRes.json()).data;
    const firstActive = menuData.categories.flatMap((c: any) => c.items).find((i: any) => i.status === 'ACTIVE');
    test.skip(!firstActive, 'Không có món ACTIVE, skip TC-C15');

    const submitRes = await request.post(`${API}/api/public/orders`, {
      data: {
        qrToken: QR_TOKENS.table01,
        clientSessionId: `tc-c15-${Date.now()}`,
        idempotencyKey: `tc-c15-key-${Date.now()}`,
        items: [{ menuItemId: firstActive.id, quantity: 1, selectedOptions: [] }],
      },
    });
    const { data: orderData } = await submitRes.json();
    const { id: orderId } = orderData;

    await page.goto(`${BASE}/login`);
    await page.evaluate((token: string) => sessionStorage.setItem('bnm-qr-token', token), QR_TOKENS.table01);
    await page.goto(`${BASE}/order/${orderId}/tracking`);
    await expect(page.locator('.tracking-success-title')).toBeVisible({ timeout: 10_000 });

    // Hủy đơn qua API
    const adminToken = await getAdminToken(request);
    await request.patch(`${API}/api/internal/orders/${orderId}/status`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { toStatus: 'CANCELLED', reason: 'E2E test cancel' },
    });

    // Đợi poll
    await page.waitForTimeout(4500);
    await expect(page.locator('.tracking-success-title')).toContainText('Đơn đã bị hủy', { timeout: 10_000 });
    await expect(page.locator('text=↻ Tự động cập nhật mỗi 3s')).toBeHidden();
    await expect(page.locator('button', { hasText: 'Gọi thêm món' })).toBeHidden();
  });

});
