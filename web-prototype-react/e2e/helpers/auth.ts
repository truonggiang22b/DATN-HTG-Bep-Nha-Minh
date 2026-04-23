/**
 * Shared helpers cho Playwright E2E tests — Bếp Nhà Mình
 */
import { type Page, type BrowserContext, expect } from '@playwright/test';

// ─── Constants ────────────────────────────────────────────────────────────────

export const API = 'http://localhost:3001';

export const ACCOUNTS = {
  admin: { email: 'admin@bepnhaminh.vn', password: 'Admin@123456' },
  kitchen: { email: 'bep@bepnhaminh.vn', password: 'Kitchen@123456' },
  admin2: { email: 'admin@commientry.vn', password: 'Admin@654321' },
} as const;

export const QR_TOKENS = {
  table01: 'qr-bnm-table-01',
  table02: 'qr-bnm-table-02',
  table03: 'qr-bnm-table-03',
  table04: 'qr-bnm-table-04',
  table05: 'qr-bnm-table-05',
} as const;

// ─── Auth helper: login via API & set token in localStorage ──────────────────

interface LoginResult {
  accessToken: string;
  user: { id: string; email: string; role: string; storeId: string };
}

const loginCache = new Map<string, LoginResult>();

/**
 * Login qua API (nhanh, không cần render UI).
 * Trả về accessToken để inject vào localStorage.
 */
export async function apiLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const cacheKey = `${email}:${password}`;
  const cached = loginCache.get(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const json = await res.json();
  loginCache.set(cacheKey, json.data);
  return json.data;
}

/**
 * Login qua UI (cho test login flow).
 * Dùng id selector vì placeholder của form không phải 'Email'/'Mật khẩu'.
 */
export async function uiLogin(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.locator('#login-submit').click();
}

/**
 * Inject auth token vào localStorage rồi navigate (bypass UI login).
 */
export async function loginAndNavigate(
  page: Page,
  account: keyof typeof ACCOUNTS,
  targetPath: string,
) {
  const { email, password } = ACCOUNTS[account];
  const result = await apiLogin(email, password);

  // Navigate tới domain trước để set sessionStorage (useAuthStore dùng sessionStorage)
  await page.goto('/login');
  await page.evaluate((data) => {
    // useAuthStore.ts dùng sessionStorage với 2 keys riêng biệt:
    // TOKEN_KEY = 'bnm-auth-token', USER_KEY = 'bnm-auth-user'
    sessionStorage.setItem('bnm-auth-token', data.accessToken);
    sessionStorage.setItem('bnm-auth-user', JSON.stringify(data.user));
  }, result);

  await page.goto(targetPath);
}

// ─── Customer helpers ────────────────────────────────────────────────────────

/**
 * Mở menu khách hàng cho bàn (qr token).
 */
export async function openCustomerMenu(page: Page, qrToken: string) {
  await page.goto(`/qr/${qrToken}`);
  // Đợi menu load
  await expect(page.locator('.menu-section')).toBeVisible({ timeout: 15_000 });
}

/**
 * Thêm món đầu tiên không cần option vào giỏ hàng qua quick-add button.
 * Trả về tên món đã thêm.
 */
export async function quickAddFirstAvailableItem(page: Page): Promise<string> {
  // Tìm card đầu tiên không phải sold-out
  const card = page.locator('.menu-card:not(.menu-card--sold-out)').first();
  const name = await card.locator('.menu-card__name').textContent() ?? '';
  await card.locator('.menu-card__add-btn').click();
  return name.trim();
}

// ─── Wait helpers ────────────────────────────────────────────────────────────

export async function waitForToast(page: Page, textMatch: string | RegExp) {
  const toast = page.locator('.toast').filter({ hasText: textMatch });
  await expect(toast).toBeVisible({ timeout: 5000 });
}

/**
 * Đợi cho spinner / loading biến mất.
 */
export async function waitForSpinnerGone(page: Page) {
  const spinner = page.locator('.spinner');
  if (await spinner.isVisible()) {
    await expect(spinner).toBeHidden({ timeout: 15_000 });
  }
}
