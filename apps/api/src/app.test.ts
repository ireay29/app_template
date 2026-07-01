import { afterAll, describe, expect, it } from 'vitest';

import { app } from './app.js';
import { closeDatabase } from './db/client.js';
import { createUsersService } from './users/users-service.js';

const usersService = createUsersService();

function authHeaders(cookie?: string) {
  return {
    'Content-Type': 'application/json',
    Origin: 'http://localhost:3000',
    ...(cookie ? { Cookie: cookie } : {}),
  };
}

function getCookieHeader(response: Response) {
  const setCookie = response.headers.get('set-cookie');

  if (!setCookie) {
    throw new Error('Expected an auth cookie.');
  }

  return setCookie
    .split(/,(?=\s*[^;,]+=)/)
    .map((cookie) => {
      const [nameValue] = cookie.split(';');

      if (!nameValue) {
        throw new Error('Expected a cookie name and value.');
      }

      return nameValue;
    })
    .join('; ');
}

async function signUp() {
  const email = `api-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const response = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      name: 'API Test User',
      password: 'password1234',
    }),
  });

  expect(response.status).toBe(200);

  return {
    cookie: getCookieHeader(response),
    email,
  };
}

describe('api app', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('returns health status', async () => {
    const response = await app.request('/api/health');
    const body = (await response.json()) as {
      status: string;
      service: string;
      database: string;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'ok',
      service: 'api',
      database: 'ok',
    });
  });

  it('returns a greeting', async () => {
    const response = await app.request('/api/greeting?name=Sam');
    const body = (await response.json()) as { message: string };

    expect(response.status).toBe(200);
    expect(body.message).toBe('Hello, Sam.');
  });

  it('rejects protected endpoints without a session', async () => {
    const adminResponse = await app.request('/api/admin/summary');
    const meResponse = await app.request('/api/me');
    const notesResponse = await app.request('/api/notes');
    const createResponse = await app.request('/api/notes', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title: 'No session' }),
    });

    expect(adminResponse.status).toBe(401);
    expect(meResponse.status).toBe(401);
    expect(notesResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
  });

  it('returns the current user and creates notes with a session cookie', async () => {
    const { cookie, email } = await signUp();

    const meResponse = await app.request('/api/me', {
      headers: authHeaders(cookie),
    });
    const meBody = (await meResponse.json()) as {
      user: { email: string; role: string };
      session: { id: string };
    };

    expect(meResponse.status).toBe(200);
    expect(meBody.user.email).toBe(email);
    expect(meBody.user.role).toBe('member');
    expect(meBody.session.id).toEqual(expect.any(String));

    const memberAdminResponse = await app.request('/api/admin/summary', {
      headers: authHeaders(cookie),
    });

    expect(memberAdminResponse.status).toBe(403);

    await usersService.updateRoleByEmail(email, 'admin');

    const adminResponse = await app.request('/api/admin/summary', {
      headers: authHeaders(cookie),
    });
    const adminBody = (await adminResponse.json()) as { role: string };

    expect(adminResponse.status).toBe(200);
    expect(adminBody.role).toBe('admin');

    const createResponse = await app.request('/api/notes', {
      method: 'POST',
      headers: authHeaders(cookie),
      body: JSON.stringify({
        title: 'Integration note',
        body: 'Created by the API test.',
      }),
    });
    const createBody = (await createResponse.json()) as {
      note: { id: string; title: string; body: string | null };
    };

    expect(createResponse.status).toBe(201);
    expect(createBody.note.title).toBe('Integration note');
    expect(createBody.note.body).toBe('Created by the API test.');

    const notesResponse = await app.request('/api/notes', {
      headers: authHeaders(cookie),
    });
    const notesBody = (await notesResponse.json()) as {
      notes: Array<{ id: string; title: string }>;
    };

    expect(notesResponse.status).toBe(200);
    expect(notesBody.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: createBody.note.id,
          title: 'Integration note',
        }),
      ]),
    );
  });
});
