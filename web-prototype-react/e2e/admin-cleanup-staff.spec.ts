import { expect, test } from '@playwright/test';
import { loginAndNavigate } from './helpers/auth';

test.describe('ADMIN - Cleanup & Staff', () => {
  test('TC-ACS-01: Admin can add a table, deactivate it, then restore it', async ({ page }) => {
    await loginAndNavigate(page, 'admin', '/admin/tables');
    await expect(page.locator('.data-table')).toBeVisible({ timeout: 10_000 });

    const suffix = Date.now();
    const tableCode = `pw-cleanup-${suffix}`;
    const displayName = `Bàn PW ${suffix}`;

    await page.getByRole('button', { name: /\+ Thêm bàn mới/i }).click();
    await expect(page.locator('.modal')).toBeVisible();

    const inputs = page.locator('.modal input');
    await inputs.nth(0).fill(tableCode);
    await inputs.nth(1).fill(displayName);
    await page.locator('.modal-footer .btn-primary').click();

    await expect(page.locator('.modal')).toBeHidden({ timeout: 10_000 });
    await expect(page.locator('tr', { hasText: displayName })).toBeVisible({ timeout: 10_000 });

    const activeRow = page.locator('tr', { hasText: displayName });
    await activeRow.getByRole('button', { name: /Ngừng sử dụng/i }).click();
    await activeRow.getByRole('button', { name: /Xác nhận/i }).click();

    await page.getByRole('button', { name: /^Ngừng sử dụng$/i }).first().click();
    const inactiveRow = page.locator('tr', { hasText: displayName });
    await expect(inactiveRow).toBeVisible({ timeout: 10_000 });
    await inactiveRow.getByRole('button', { name: /Bật lại/i }).click();

    await page.getByRole('button', { name: /^Đang sử dụng$/i }).first().click();
    await expect(page.locator('tr', { hasText: displayName })).toBeVisible({ timeout: 10_000 });
  });

  test('TC-ACS-02: Staff page loads and shows management controls', async ({ page }) => {
    await loginAndNavigate(page, 'admin', '/admin/staff');

    await expect(page).toHaveURL('/admin/staff');
    await expect(page.getByRole('heading', { name: /Nhân viên/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Thêm nhân viên/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Tất cả vai trò/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Đang hoạt động/i })).toBeVisible();
  });

  test('TC-ACS-03: Creating staff from UI should close modal and append new row', async ({ page }) => {
    await page.route('**/api/internal/users', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            user: {
              id: 'pw-staff-created',
              email: 'mock.staff@bepnhaminh.vn',
              displayName: 'Mock Staff UI',
              isActive: true,
              defaultBranchId: null,
              roles: ['KITCHEN'],
              createdAt: new Date().toISOString(),
            },
          },
        }),
      });
    });

    await loginAndNavigate(page, 'admin', '/admin/staff');
    await expect(page.getByRole('button', { name: /Thêm nhân viên/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /Thêm nhân viên/i }).click();
    await expect(page.locator('.modal, [style*="position: fixed"]')).toBeVisible();

    await page.getByLabel(/Tên hiển thị/i).fill('Mock Staff UI');
    await page.getByLabel(/^Email/i).fill('mock.staff@bepnhaminh.vn');
    await page.getByLabel(/Mật khẩu tạm/i).fill('MockPass!123');
    await page.getByLabel(/Vai trò/i).selectOption('KITCHEN');
    await page.getByRole('button', { name: /Tạo tài khoản/i }).click();

    await expect(page.locator('text=Mock Staff UI').last()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.modal, [style*="position: fixed"]')).toBeHidden({ timeout: 5_000 });
  });
});
