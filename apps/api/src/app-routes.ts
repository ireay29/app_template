import { swaggerUI } from '@hono/swagger-ui';

import type { AppDependencies } from './app-dependencies.js';
import type { MaintenanceSettings } from './config/maintenance.js';
import { toMeResponse, toNoteResponse } from './http/presenters.js';
import type { RouteRegistrar } from './http/route-registry.js';
import { adminSummaryRoute } from './routes/admin.js';
import { greetingRoute } from './routes/greeting.js';
import { healthRoute, readyRoute } from './routes/health.js';
import { maintenanceRoute } from './routes/maintenance.js';
import { meRoute } from './routes/me.js';
import { createNoteRoute, getNotesRoute } from './routes/notes.js';
type DatabaseStatus = 'ok' | 'unavailable';

async function getDatabaseStatus(
  checkDatabase: AppDependencies['checkDatabase'],
): Promise<DatabaseStatus> {
  try {
    await checkDatabase();
    return 'ok';
  } catch {
    return 'unavailable';
  }
}

export function registerSystemRoutes(
  app: RouteRegistrar,
  dependencies: AppDependencies,
  maintenance: MaintenanceSettings,
) {
  app.openapi(maintenanceRoute, 'public', (c) => {
    c.header('Cache-Control', 'no-store');
    return c.json(maintenance, 200);
  });

  app.openapi(healthRoute, 'public', async (c) => {
    return c.json({
      status: 'ok',
      service: 'api',
      uptime: process.uptime(),
    });
  });

  app.openapi(readyRoute, 'public', async (c) => {
    const database = await getDatabaseStatus(dependencies.checkDatabase);
    const body = {
      status: 'ok' as const,
      service: 'api',
      uptime: process.uptime(),
      database,
    };

    if (database === 'unavailable') {
      return c.json(body, 503);
    }

    return c.json(body, 200);
  });

  app.openapi(greetingRoute, 'public', (c) => {
    const query = c.req.valid('query');
    const name = query.name ?? 'friend';

    return c.json(
      {
        message: `Hello, ${name}.`,
      },
      200,
    );
  });
}

export function registerAuthRoutes(app: RouteRegistrar, dependencies: AppDependencies) {
  app.on('ALL', '/api/auth/*', 'public', (c) => dependencies.handleAuth(c.req.raw));

  app.openapi(meRoute, 'authenticated', async (c) => {
    const { authSession, role } = c.get('principal');
    return c.json(toMeResponse(authSession, role), 200);
  });
}

export function registerAdminRoutes(app: RouteRegistrar) {
  app.openapi(adminSummaryRoute, 'admin', async (c) => {
    return c.json(
      {
        message: 'Admin API access granted.',
        role: c.get('principal').role,
      },
      200,
    );
  });
}

export function registerNotesRoutes(app: RouteRegistrar, dependencies: AppDependencies) {
  app.openapi(getNotesRoute, 'authenticated', async (c) => {
    const { authSession } = c.get('principal');
    const notes = await dependencies.notesService.listForUser(authSession.user.id);

    return c.json({ notes: notes.map(toNoteResponse) }, 200);
  });

  app.openapi(createNoteRoute, 'authenticated', async (c) => {
    const { authSession } = c.get('principal');
    const payload = c.req.valid('json');
    const note = await dependencies.notesService.createForUser(authSession.user.id, payload);

    return c.json({ note: toNoteResponse(note) }, 201);
  });
}

export function registerOpenApiDocs(app: RouteRegistrar) {
  app.document('/api/openapi.json', 'public', {
    openapi: '3.0.3',
    info: {
      title: 'App Template API',
      version: '0.1.0',
    },
  });

  app.on(
    'GET',
    '/api/docs',
    'public',
    swaggerUI({
      url: '/api/openapi.json',
    }),
  );
}
