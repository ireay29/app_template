import { expect, test } from '@playwright/test';

test('rejects unauthenticated API calls, including HEAD and malformed writes', async ({
  request,
}) => {
  for (const path of ['/api/me', '/api/notes', '/api/admin/summary']) {
    expect((await request.get(path)).status()).toBe(401);
    expect((await request.head(path)).status()).toBe(401);
  }
  const write = await request.post('/api/notes', {
    headers: { 'Content-Type': 'application/json' },
    data: 'invalid json',
  });
  expect(write.status()).toBe(401);
});

test('preserves declared public endpoints and unknown-route behavior', async ({ request }) => {
  for (const path of [
    '/api/health',
    '/api/ready',
    '/api/maintenance',
    '/api/greeting',
    '/api/docs',
  ]) {
    expect((await request.get(path)).status()).toBe(200);
  }
  expect((await request.get('/api/not-a-route')).status()).toBe(404);
  const schema = await request.get('/api/openapi.json');
  expect(schema.status()).toBe(200);
  const document = await schema.json();
  expect(document.paths['/api/me'].get['x-access']).toBe('authenticated');
  expect(document.paths['/api/admin/summary'].get['x-access']).toBe('admin');
  expect(document.paths['/api/health'].get['x-access']).toBe('public');
});
