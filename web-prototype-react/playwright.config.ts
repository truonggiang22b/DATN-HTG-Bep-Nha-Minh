import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E config cho hệ thống "Bếp Nhà Mình"
 *
 * Yêu cầu: Backend (port 3001) và Frontend (port 5173) phải đang chạy.
 *   cd backend-api && npm run dev
 *   cd web-prototype-react && npm run dev
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,           // Chạy tuần tự vì test chia sẻ data trên cùng DB
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,                     // Đảm bảo không song song (cùng DB)
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  timeout: 60_000,                // Mỗi test tối đa 60s
  expect: { timeout: 10_000 },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
