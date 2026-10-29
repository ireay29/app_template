import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../app.js';
import { createDefaultAppDependencies } from '../app-dependencies.js';
import { env } from '../config/env.js';
import { getMaintenanceSettings } from '../config/maintenance.js';
import { maintenanceStatusSchema } from '../routes/maintenance.js';

function createTestApp(mode: 'off' | 'read-only' | 'full') {
  const checkDatabase = vi.fn(async () => undefined);
  const handleAuth = vi.fn(() => new Response('auth handler'));
  const settings = getMaintenanceSettings({
    MAINTENANCE_MODE: mode,
    MAINTENANCE_RETRY_AFTER_SECONDS: '1200',
    // An elapsed estimate must not silently reopen a service that is still under repair.
    MAINTENANCE_ENDS_AT: '2020-01-01T00:00:00Z',
  });
  const app = createApp({ ...createDefaultAppDependencies(), checkDatabase, handleAuth }, settings);
  const mutate = vi.fn(() => new Response('updated'));
  app.on(['POST', 'PUT', 'PATCH', 'DELETE'], '/api/mutation-probe', mutate);

  return { app, checkDatabase, handleAuth, mutate, settings };
}

describe('maintenance API boundary', () => {
  it('leaves authentication and writes available when off', async () => {
    const { app, handleAuth, mutate } = createTestApp('off');
    expect((await app.request('/api/auth/sign-in/email', { method: 'POST' })).status).toBe(200);
    expect((await app.request('/api/mutation-probe', { method: 'POST' })).status).toBe(200);
    expect(handleAuth).toHaveBeenCalledOnce();
    expect(mutate).toHaveBeenCalledOnce();
  });

  it.each(['off', 'read-only', 'full'] as const)(
    'keeps uncached public status and health checks available in %s mode',
    async (mode) => {
      const { app, settings, checkDatabase } = createTestApp(mode);
      const response = await app.request('/api/maintenance');
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(maintenanceStatusSchema.parse(await response.json())).toEqual(settings);
      expect((await app.request('/api/health')).status).toBe(200);
      expect((await app.request('/api/health', { method: 'HEAD' })).status).toBe(200);
      expect(checkDatabase).not.toHaveBeenCalled();
      expect((await app.request('/api/ready')).status).toBe(200);
      expect(checkDatabase).toHaveBeenCalledOnce();
    },
  );

  it('allows reads and session lookups in read-only mode', async () => {
    const { app, handleAuth } = createTestApp('read-only');
    expect((await app.request('/api/greeting')).status).toBe(200);
    expect((await app.request('/api/greeting', { method: 'HEAD' })).status).toBe(200);
    expect((await app.request('/api/auth/get-session')).status).toBe(200);
    expect((await app.request('/api/notes')).status).toBe(401);
    expect(handleAuth).toHaveBeenCalledOnce();
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'blocks %s before mutation handlers',
    async (method) => {
      const { app, mutate, settings } = createTestApp('read-only');
      const response = await app.request('/api/mutation-probe', {
        method,
        headers: { Origin: env.WEB_ORIGIN },
      });
      expect(response.status).toBe(503);
      expect(response.headers.get('retry-after')).toBe('1200');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('access-control-allow-origin')).toBe(env.WEB_ORIGIN);
      expect(response.headers.get('access-control-expose-headers')).toBe('Retry-After');
      expect(await response.json()).toEqual({
        error: 'Service Unavailable',
        code: 'MAINTENANCE',
        maintenance: settings,
      });
      expect(mutate).not.toHaveBeenCalled();
    },
  );

  it('blocks auth writes and note writes before auth or validation runs', async () => {
    const { app, handleAuth } = createTestApp('read-only');
    for (const path of ['/api/auth/sign-in/email', '/api/auth/sign-out', '/api/notes']) {
      expect((await app.request(path, { method: 'POST', body: 'invalid json' })).status).toBe(503);
    }
    expect(handleAuth).not.toHaveBeenCalled();
  });

  it('blocks normal reads in full mode before session or database work', async () => {
    const { app, handleAuth, checkDatabase } = createTestApp('full');
    for (const path of [
      '/api/greeting',
      '/api/notes',
      '/api/admin/summary',
      '/api/auth/get-session',
    ]) {
      expect((await app.request(path)).status).toBe(503);
    }
    expect(handleAuth).not.toHaveBeenCalled();
    expect(checkDatabase).not.toHaveBeenCalled();
  });

  it('preserves database-backed readiness failures during maintenance', async () => {
    const { app, checkDatabase } = createTestApp('full');
    checkDatabase.mockRejectedValueOnce(new Error('database unavailable'));
    expect((await app.request('/api/ready')).status).toBe(503);
  });

  it('allows CORS preflight during a full stop', async () => {
    const { app } = createTestApp('full');
    const response = await app.request('/api/notes', {
      method: 'OPTIONS',
      headers: { Origin: env.WEB_ORIGIN, 'Access-Control-Request-Method': 'POST' },
    });
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(env.WEB_ORIGIN);
  });
});
