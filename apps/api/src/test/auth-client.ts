import { expect } from 'vitest';

import type { createApp } from '../app.js';

export function authHeaders(cookie?: string) {
  return {
    'Content-Type': 'application/json',
    Origin: 'http://localhost:3000',
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

function getCookieHeader(response: Response) {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) throw new Error('Expected an auth cookie.');
  return setCookie
    .split(/,(?=\s*[^;,]+=)/)
    .map((cookie) => {
      const [nameValue] = cookie.split(';');
      if (!nameValue) throw new Error('Expected a cookie name and value.');
      return nameValue;
    })
    .join('; ');
}

export async function signUp(app: ReturnType<typeof createApp>) {
  const email = `api-${Date.now()}-${crypto.randomUUID()}@example.com`;
  const response = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, name: 'API Test User', password: 'password1234' }),
  });
  expect(response.status).toBe(200);
  return { cookie: getCookieHeader(response), email };
}
