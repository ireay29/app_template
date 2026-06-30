import { expect, test } from '@playwright/test';

test('loads the workspace dashboard and API status', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Vite React frontend/i })).toBeVisible();
  await expect(page.getByText('API online')).toBeVisible();
  await expect(page.getByText('Material UI', { exact: true })).toBeVisible();
  await expect(page.getByText('shadcn/ui', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'API docs' })).toHaveAttribute('href', '/api/docs');
});

test('signs up, creates a note, and signs out', async ({ page }) => {
  const email = `e2e-${Date.now()}-${crypto.randomUUID()}@example.com`;

  await page.goto('/');

  await page.getByLabel('Name').fill('E2E User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password1234');
  await page.getByRole('button', { name: 'Sign up' }).click();

  await expect(page.getByText(email)).toBeVisible();

  await page.getByLabel('Note title').fill('E2E note');
  await page.getByLabel('Body').fill('Created through Playwright.');
  await page.getByRole('button', { name: 'Save note' }).click();

  await expect(page.getByText('E2E note')).toBeVisible();
  await expect(page.getByText('Created through Playwright.')).toBeVisible();

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByText('Signed out', { exact: true })).toBeVisible();
});
