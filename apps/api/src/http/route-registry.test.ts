import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../app.js';
import { getMaintenanceSettings } from '../config/maintenance.js';
import { createAccessFixture } from '../test/access-fixture.js';
import type { AppEnv } from '../types.js';
import { createRouteRegistry } from './route-registry.js';

const writeRoute = createRoute({
  method: 'post',
  path: '/api/write',
  request: {
    body: {
      required: true,
      content: {
        'application/json': {
          schema: z.object({ title: z.string().min(1) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Saved',
      content: {
        'application/json': {
          schema: z.object({ title: z.string() }),
        },
      },
    },
  },
});

describe('explicit route access registration', () => {
  it('requires the boundary to precede all other routes and middleware', () => {
    const { dependencies } = createAccessFixture();
    const app = new OpenAPIHono<AppEnv>();
    app.get('/api/early', (c) => c.text('unexpected'));
    expect(() =>
      createRouteRegistry(app, dependencies, {
        webOrigins: [],
        maintenance: getMaintenanceSettings(),
      }),
    ).toThrow('before registering');
  });

  it('rejects missing or invalid access declarations at registration', () => {
    const { registry } = createAccessFixture();
    for (const access of [undefined, null, 'member']) {
      expect(() =>
        registry.routes.on('GET', '/api/test', access as never, (c) => c.text('x')),
      ).toThrow('Every route must declare');
    }
  });

  it.each(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])(
    'rejects undeclared %s handlers before they can run',
    async (method) => {
      const { app, registry } = createAccessFixture();
      const handler = vi.fn(() => new Response('private data'));
      app.on(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], '/api/accidental', handler);
      expect(() => registry.assertComplete()).toThrow('Undeclared route access');
      expect((await app.request('/api/accidental', { method })).status).toBe(403);
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it('rejects a direct middleware response and mounted subapps', async () => {
    const { app, registry } = createAccessFixture();
    const handler = vi.fn(async () => new Response('private data'));
    app.use('/api/accidental', handler);
    const child = new OpenAPIHono<AppEnv>();
    child.get('/private', handler);
    app.route('/api/plugin', child);
    expect((await app.request('/api/accidental')).status).toBe(403);
    expect((await app.request('/api/plugin/private')).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(() => registry.assertComplete()).toThrow('Undeclared route access');
  });

  it('does not let a declared public route authorize an undeclared handler at the same path', async () => {
    const { app, registry } = createAccessFixture();
    const publicHandler = vi.fn(() => new Response('public'));
    const extraHandler = vi.fn(() => new Response('private'));
    registry.routes.on('GET', '/api/public', 'public', publicHandler);
    app.get('/api/public', extraHandler);
    expect((await app.request('/api/public')).status).toBe(403);
    expect(publicHandler).not.toHaveBeenCalled();
    expect(extraHandler).not.toHaveBeenCalled();
  });

  it('rejects a public wildcard overlapping an admin route', async () => {
    const { app, registry, getSession } = createAccessFixture();
    const handler = vi.fn(() => new Response('unexpected'));
    registry.routes.on('ALL', '/api/delegated/*', 'public', handler);
    registry.routes.on('GET', '/api/delegated/private', 'admin', handler);
    expect((await app.request('/api/delegated/private')).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });

  it('does not expose a new raw handler under the Better Auth prefix', async () => {
    const { dependencies, handleAuth } = createAccessFixture();
    const app = createApp(dependencies, getMaintenanceSettings());
    const handler = vi.fn(() => new Response('private data'));
    app.get('/api/auth/accidental', handler);
    expect((await app.request('/api/auth/accidental')).status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
    expect(handleAuth).not.toHaveBeenCalled();
  });

  it('keeps public routes independent of session services and unknown routes at 404', async () => {
    const { app, registry, getSession, requireById } = createAccessFixture();
    registry.routes.on('GET', '/api/public', 'public', (c) => c.text('public'));
    registry.assertComplete();
    expect((await app.request('/api/public')).status).toBe(200);
    expect((await app.request('/api/unknown')).status).toBe(404);
    expect(getSession).not.toHaveBeenCalled();
    expect(requireById).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated requests before body validation and handler side effects', async () => {
    const { app, registry, getSession, session } = createAccessFixture();
    const save = vi.fn();
    registry.routes.openapi(writeRoute, 'authenticated', (c) => {
      save(c.get('principal').authSession.user.id);
      return c.json(c.req.valid('json'), 200);
    });
    expect((await app.request('/api/write', { method: 'POST', body: 'invalid json' })).status).toBe(
      401,
    );
    expect(save).not.toHaveBeenCalled();
    getSession.mockResolvedValue(session);
    const response = await app.request('/api/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Saved' }),
    });
    expect(response.status).toBe(200);
    expect(save).toHaveBeenCalledExactlyOnceWith(session.user.id);
  });

  it('enforces roles on every request using the current server-side user record', async () => {
    const { app, registry, getSession, session, user } = createAccessFixture();
    const handler = vi.fn(() => new Response('admin data'));
    registry.routes.on('GET', '/api/admin-check', 'admin', handler);
    expect((await app.request('/api/admin-check')).status).toBe(401);
    getSession.mockResolvedValue(session);
    expect((await app.request('/api/admin-check')).status).toBe(403);
    user.role = 'admin';
    expect((await app.request('/api/admin-check')).status).toBe(200);
    user.role = 'member';
    expect((await app.request('/api/admin-check', { method: 'HEAD' })).status).toBe(403);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('fails closed if session or user lookup fails', async () => {
    const { app, registry, getSession, session, requireById } = createAccessFixture();
    const handler = vi.fn(() => new Response('private data'));
    registry.routes.on('GET', '/api/protected', 'authenticated', handler);
    getSession.mockRejectedValueOnce(new Error('session unavailable'));
    expect((await app.request('/api/protected')).status).toBe(500);
    getSession.mockResolvedValue(session);
    requireById.mockRejectedValueOnce(new Error('user missing'));
    expect((await app.request('/api/protected')).status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });

  it('derives OpenAPI access and failure responses from the same declaration', () => {
    const { app, registry } = createAccessFixture();
    registry.routes.openapi(writeRoute, 'admin', (c) => c.json(c.req.valid('json'), 200));
    const schema = app.getOpenAPIDocument({
      openapi: '3.0.3',
      info: { title: 'Test', version: '1' },
    });
    expect(schema.paths?.['/api/write']?.post).toMatchObject({
      'x-access': 'admin',
      responses: { 200: expect.any(Object), 401: expect.any(Object), 403: expect.any(Object) },
    });
  });
});
