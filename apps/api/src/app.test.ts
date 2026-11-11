import { afterAll, describe, expect, it } from 'vitest';

import { app, createApp } from './app.js';
import { env } from './config/env.js';
import { closeDatabase } from './db/client.js';
import { authHeaders, signUp } from './test/auth-client.js';
import { createUsersService } from './users/users-service.js';

const usersService = createUsersService();

describe('api app', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('returns health status', async () => {
    const response = await app.request('/api/health');
    const body = (await response.json()) as {
      status: string;
      service: string;
    };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: 'ok',
      service: 'api',
    });
  });

  it('uses a fixed CORS header allowlist instead of reflecting requested headers', async () => {
    const response = await app.request('/api/notes', {
      method: 'OPTIONS',
      headers: {
        Origin: env.WEB_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-untrusted-header',
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(env.WEB_ORIGIN);
    expect(response.headers.get('access-control-allow-credentials')).toBe('true');
    expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type,Authorization');
  });

  it('returns readiness status', async () => {
    const response = await app.request('/api/ready');
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

  it('returns unavailable readiness status when the database check fails', async () => {
    const unavailableApp = createApp({
      checkDatabase: async () => {
        throw new Error('database unavailable');
      },
      handleAuth: () => new Response(null, { status: 404 }),
      getSession: async () => null,
      notesService: {
        createForUser: async () => {
          throw new Error('not implemented');
        },
        listForUser: async () => {
          throw new Error('not implemented');
        },
      },
      usersService: {
        findByEmail: async () => {
          throw new Error('not implemented');
        },
        requireById: async () => {
          throw new Error('not implemented');
        },
        updateRoleByEmail: async () => {
          throw new Error('not implemented');
        },
      },
    });
    const response = await unavailableApp.request('/api/ready');
    const body = (await response.json()) as {
      status: string;
      service: string;
      database: string;
    };

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      status: 'ok',
      service: 'api',
      database: 'unavailable',
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
    const { cookie, email } = await signUp(app);

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

  it('keeps notes scoped to the authenticated owner even after another user becomes admin', async () => {
    const owner = await signUp(app);
    const other = await signUp(app);
    const ownerRecord = await usersService.findByEmail(owner.email);
    const otherRecord = await usersService.findByEmail(other.email);
    if (!ownerRecord || !otherRecord) throw new Error('Expected both test accounts.');

    const created = await app.request('/api/notes', {
      method: 'POST',
      headers: authHeaders(owner.cookie),
      body: JSON.stringify({ title: 'Private owner note', userId: otherRecord.id }),
    });
    expect(created.status).toBe(201);
    const { note } = (await created.json()) as { note: { id: string } };
    expect(note.id).toEqual(expect.any(String));

    const ownNotes = await app.request('/api/notes', { headers: authHeaders(owner.cookie) });
    expect(await ownNotes.json()).toMatchObject({
      notes: expect.arrayContaining([expect.objectContaining({ id: note.id })]),
    });

    for (const role of ['member', 'admin'] as const) {
      await usersService.updateRoleByEmail(other.email, role);
      const response = await app.request(`/api/notes?userId=${ownerRecord.id}`, {
        headers: authHeaders(other.cookie),
      });
      expect(response.status).toBe(200);
      const body = (await response.json()) as { notes: Array<{ id: string }> };
      expect(body.notes.map((record) => record.id)).not.toContain(note.id);
    }
  });

  it('revokes admin access immediately after demotion with the same session cookie', async () => {
    const { cookie, email } = await signUp(app);
    const request = () => app.request('/api/admin/summary', { headers: authHeaders(cookie) });
    await usersService.updateRoleByEmail(email, 'admin');
    expect((await request()).status).toBe(200);

    await usersService.updateRoleByEmail(email, 'member');
    expect((await request()).status).toBe(403);
    const me = await app.request('/api/me', { headers: authHeaders(cookie) });
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ user: { role: 'member' } });
  });

  it('rejects a saved session cookie after sign-out, including a protected write', async () => {
    const { cookie, email } = await signUp(app);
    await usersService.updateRoleByEmail(email, 'admin');
    expect((await app.request('/api/admin/summary', { headers: authHeaders(cookie) })).status).toBe(
      200,
    );
    const signedOut = await app.request('/api/auth/sign-out', {
      method: 'POST',
      headers: authHeaders(cookie),
      body: '{}',
    });
    expect(signedOut.status).toBe(200);

    for (const path of ['/api/me', '/api/notes', '/api/admin/summary']) {
      expect((await app.request(path, { headers: authHeaders(cookie) })).status).toBe(401);
    }
    const write = await app.request('/api/notes', {
      method: 'POST',
      headers: authHeaders(cookie),
      body: JSON.stringify({ title: 'Revoked' }),
    });
    expect(write.status).toBe(401);
  });
});
