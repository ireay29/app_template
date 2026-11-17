import { expect } from '@playwright/test';

import { test } from './flow-evidence';

const maintenance = {
  mode: 'read-only',
  message: '設備更新のため操作を停止しています。',
  endsAt: '2026-11-01T06:00:00Z',
  infoUrl: 'https://status.example.com/',
  retryAfterSeconds: 3600,
};

test(
  'keeps the dashboard readable and disables sign-in and sign-up during maintenance',
  { tag: '@maintenance' },
  async ({ observeState, page }) => {
    let mode = 'read-only';
    await page.route('**/api/maintenance', (route) =>
      route.fulfill({ json: { ...maintenance, mode } }),
    );
    await page.goto('/');

    await expect(page.getByRole('status', { name: 'メンテナンスのお知らせ' })).toContainText(
      maintenance.message,
    );
    await expect(page.getByRole('heading', { name: /Vite React frontend/i })).toBeVisible();
    await expect(page.getByLabel('Checking session')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    await expect(page.getByRole('link', { name: '状況・お問い合わせ' })).toHaveAttribute(
      'href',
      maintenance.infoUrl,
    );
    observeState(
      'Open dashboard during read-only maintenance',
      'Dashboard readable and sign-in and sign-up disabled',
    );

    mode = 'off';
    await page.reload();
    await expect(page.getByRole('status', { name: 'メンテナンスのお知らせ' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    observeState('End maintenance and reload', 'Sign in re-enabled');
  },
);

test(
  'shows a full stop notice in an already delivered SPA',
  { tag: '@maintenance' },
  async ({ observeState, page }) => {
    await page.route('**/api/maintenance', (route) =>
      route.fulfill({ json: { ...maintenance, mode: 'full' } }),
    );
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'メンテナンスのお知らせ' })).toBeVisible();
    await expect(page.getByRole('status', { name: 'メンテナンスのお知らせ' })).toContainText(
      'サービスを一時停止しています',
    );
    await expect(page.getByRole('heading', { name: 'Admin area' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);
    observeState('Open Admin area during full maintenance', 'Full-page maintenance notice');
  },
);

test(
  'ships a script-free maintenance asset and a crawlable robots file',
  { tag: '@maintenance' },
  async ({ page, request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain('Allow: /');
    expect(await robots.text()).not.toContain('Disallow: /');

    const response = await page.goto('/maintenance.html');
    // This is the static asset URL. The delivery layer must serve its body with 503 at original URLs.
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'ただいまメンテナンスを実施しています' }),
    ).toBeVisible();
    await expect(page.locator('script, link[rel="stylesheet"], meta[name="robots"]')).toHaveCount(
      0,
    );
  },
);
