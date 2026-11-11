import { describe, expect, it, vi } from 'vitest';

import { createAccessFixture } from '../test/access-fixture.js';

describe('pre-authorization response boundary', () => {
  it('exposes no generic middleware registration on either registry surface', () => {
    const { registry } = createAccessFixture();
    expect(registry).not.toHaveProperty('use');
    expect(registry.routes).not.toHaveProperty('use');
  });

  it.each(['authenticated', 'admin'] as const)(
    'rejects a raw short-circuit response before a declared %s endpoint',
    async (access) => {
      const { app, registry, getSession } = createAccessFixture();
      const cache = vi.fn(async () => new Response('cached private data'));
      const handler = vi.fn(() => new Response('protected data'));
      app.use('/api/cached', cache);
      registry.routes.on('GET', '/api/cached', access, handler);

      expect(() => registry.assertComplete()).toThrow('Undeclared route access');
      expect((await app.request('/api/cached')).status).toBe(403);
      expect(cache).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
      expect(getSession).not.toHaveBeenCalled();
    },
  );

  it.each(['authenticated', 'admin'] as const)(
    'authorizes %s access before an explicitly registered cache can respond',
    async (access) => {
      const { app, registry, getSession, session, user } = createAccessFixture();
      const cache = vi.fn(() => new Response('cached private data'));
      const handler = vi.fn(() => new Response('protected data'));
      registry.routes.on('GET', '/api/cached', access, cache);
      registry.routes.on('GET', '/api/cached', access, handler);
      registry.assertComplete();

      expect((await app.request('/api/cached')).status).toBe(401);
      expect(cache).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();

      getSession.mockResolvedValue(session);
      if (access === 'admin') {
        expect((await app.request('/api/cached')).status).toBe(403);
        expect(cache).not.toHaveBeenCalled();
        user.role = 'admin';
      }

      const response = await app.request('/api/cached');
      expect(response.status).toBe(200);
      expect(await response.text()).toBe('cached private data');
      expect(cache).toHaveBeenCalledOnce();
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it('rejects a public cache overlapping a protected endpoint before it responds', async () => {
    const { app, registry, getSession } = createAccessFixture();
    const cache = vi.fn(() => new Response('cached private data'));
    registry.routes.on('GET', '/api/cached', 'public', cache);
    registry.routes.on('GET', '/api/cached', 'admin', () => new Response('admin data'));

    expect((await app.request('/api/cached')).status).toBe(403);
    expect(cache).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });
});
