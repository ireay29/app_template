import { expect, type Page, test } from '@playwright/test';

async function signIn(page: Page, email: string) {
  await page.goto('/');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password1234');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText(email)).toBeVisible();
}

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

test('requires authentication before opening the admin page', async ({ page }) => {
  await page.goto('/admin');

  await expect(page.getByRole('status')).toContainText('Authentication required');
  await expect(page.getByText('Sign in before opening this protected page.')).toBeVisible();
});

test('prevents a seeded member user from opening the admin area', async ({ page }) => {
  await signIn(page, 'member@example.com');

  const response = await page.evaluate(async () => {
    const result = await fetch('/api/admin/summary', { credentials: 'include' });
    return { body: await result.json(), status: result.status };
  });

  expect(response).toEqual({ body: { error: 'Forbidden' }, status: 403 });

  await page.goto('/admin');
  await expect(page.getByRole('status')).toContainText('Admin access required');
  await expect(page.getByText('Your account does not have access to this page.')).toBeVisible();
});

test('allows a seeded admin user to open the admin area', async ({ page }) => {
  await signIn(page, 'admin@example.com');

  await page.goto('/admin');

  await expect(page.getByRole('heading', { name: 'Admin area' })).toBeVisible();
  await expect(page.getByText('Admin API access granted.')).toBeVisible();
  await expect(page.getByText('Role: admin')).toBeVisible();
});
