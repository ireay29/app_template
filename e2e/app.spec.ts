import { expect, test } from '@playwright/test';

test('loads the workspace dashboard and API status', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Vite React frontend/i })).toBeVisible();
  await expect(page.getByText('API online')).toBeVisible();
  await expect(page.getByText('Material UI', { exact: true })).toBeVisible();
  await expect(page.getByText('shadcn/ui', { exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'API docs' })).toHaveAttribute('href', '/api/docs');
});
