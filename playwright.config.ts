import { defineConfig } from 'playwright/test';

const viewports = [
  ['mobile-320', { width: 320, height: 568 }],
  ['mobile-375', { width: 375, height: 667 }],
  ['mobile-393', { width: 393, height: 852 }],
  ['mobile-412', { width: 412, height: 915 }],
  ['mobile-430', { width: 430, height: 932 }],
  ['tablet', { width: 768, height: 1024 }],
  ['desktop-1280', { width: 1280, height: 800 }],
  ['desktop-1440', { width: 1440, height: 900 }],
] as const;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 60_000,
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: viewports.map(([name, viewport]) => ({ name, use: { viewport } })),
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:3000/login',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
