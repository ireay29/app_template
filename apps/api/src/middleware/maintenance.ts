import { createMiddleware } from 'hono/factory';

import type { MaintenanceSettings } from '../config/maintenance.js';
import type { AppEnv } from '../types.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const operationalPaths = new Set(['/api/health', '/api/ready', '/api/maintenance']);

export function maintenanceGuard(settings: MaintenanceSettings) {
  return createMiddleware<AppEnv>(async (c, next) => {
    const safe = safeMethods.has(c.req.method);

    if (
      settings.mode === 'off' ||
      (safe && (settings.mode === 'read-only' || operationalPaths.has(c.req.path)))
    ) {
      return next();
    }

    c.header('Cache-Control', 'no-store');
    c.header('Retry-After', String(settings.retryAfterSeconds));

    return c.json(
      { error: 'Service Unavailable', code: 'MAINTENANCE', maintenance: settings },
      503,
    );
  });
}
