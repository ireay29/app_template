import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.WEB_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${webPort}`;
const captureAll = process.env.E2E_EVIDENCE === '1';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    [process.env.CI ? 'github' : 'list'],
    ...(process.env.CI || captureAll ? ([['html', { open: 'never' }]] as const) : []),
  ],
  use: {
    baseURL,
    screenshot: captureAll ? 'on' : 'only-on-failure',
    trace: captureAll ? 'on' : 'retain-on-failure',
    video: captureAll ? 'on' : 'retain-on-failure',
  },
  webServer: {
    command: process.env.CI ? 'pnpm dev:servers' : 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
