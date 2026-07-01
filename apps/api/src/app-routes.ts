import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';

import type { AppDependencies } from './app-dependencies.js';
import { toMeResponse, toNoteResponse, unauthorizedBody } from './http/presenters.js';
import { requireAuth } from './middleware/session.js';
import { greetingRoute } from './routes/greeting.js';
import { healthRoute } from './routes/health.js';
import { meRoute } from './routes/me.js';
import { createNoteRoute, getNotesRoute } from './routes/notes.js';
import type { AppEnv } from './types.js';

type AppInstance = OpenAPIHono<AppEnv>;
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

export function registerSystemRoutes(app: AppInstance, dependencies: AppDependencies) {
  app.openapi(healthRoute, async (c) => {
    const database = await getDatabaseStatus(dependencies.checkDatabase);

    return c.json({
      status: 'ok',
      service: 'api',
      uptime: process.uptime(),
      database,
    });
  });

  app.openapi(greetingRoute, (c) => {
    const query = c.req.valid('query');
    const name = query.name ?? 'friend';

    return c.json({
      message: `Hello, ${name}.`,
    });
  });
}

export function registerAuthRoutes(app: AppInstance, dependencies: AppDependencies) {
  app.all('/api/auth/*', (c) => dependencies.handleAuth(c.req.raw));

  app.openapi(meRoute, (c) => {
    const authSession = requireAuth(c);

    if (!authSession) {
      return c.json(unauthorizedBody, 401);
    }

    return c.json(toMeResponse(authSession), 200);
  });
}

export function registerNotesRoutes(app: AppInstance, dependencies: AppDependencies) {
  app.openapi(getNotesRoute, async (c) => {
    const authSession = requireAuth(c);

    if (!authSession) {
      return c.json(unauthorizedBody, 401);
    }

    const notes = await dependencies.notesService.listForUser(authSession.user.id);

    return c.json({ notes: notes.map(toNoteResponse) }, 200);
  });

  app.openapi(createNoteRoute, async (c) => {
    const authSession = requireAuth(c);

    if (!authSession) {
      return c.json(unauthorizedBody, 401);
    }

    const payload = c.req.valid('json');
    const note = await dependencies.notesService.createForUser(authSession.user.id, payload);

    return c.json({ note: toNoteResponse(note) }, 201);
  });
}

export function registerOpenApiDocs(app: AppInstance) {
  app.doc('/api/openapi.json', {
    openapi: '3.0.3',
    info: {
      title: 'App Template API',
      version: '0.1.0',
    },
  });

  app.get(
    '/api/docs',
    swaggerUI({
      url: '/api/openapi.json',
    }),
  );
}
