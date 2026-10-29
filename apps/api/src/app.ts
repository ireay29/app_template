import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { timing } from 'hono/timing';

import { type AppDependencies, createDefaultAppDependencies } from './app-dependencies.js';
import {
  registerAdminRoutes,
  registerAuthRoutes,
  registerNotesRoutes,
  registerOpenApiDocs,
  registerSystemRoutes,
} from './app-routes.js';
import { env, webOrigins } from './config/env.js';
import { getMaintenanceSettings, type MaintenanceSettings } from './config/maintenance.js';
import { maintenanceGuard } from './middleware/maintenance.js';
import { sessionContext } from './middleware/session.js';
import type { AppEnv } from './types.js';

export function createApp(
  dependencies: AppDependencies = createDefaultAppDependencies(),
  maintenance: MaintenanceSettings = getMaintenanceSettings(env),
) {
  const app = new OpenAPIHono<AppEnv>();

  app.use('*', timing());
  app.use(
    '/api/*',
    cors({
      origin: webOrigins,
      credentials: true,
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Retry-After'],
    }),
  );

  app.use('/api/*', maintenanceGuard(maintenance));

  app.use('/api/me', sessionContext);
  app.use('/api/admin/*', sessionContext);
  app.use('/api/notes', sessionContext);
  app.use('/api/notes/*', sessionContext);

  registerAuthRoutes(app, dependencies);
  registerAdminRoutes(app, dependencies);
  registerSystemRoutes(app, dependencies, maintenance);
  registerNotesRoutes(app, dependencies);
  registerOpenApiDocs(app);

  app.notFound((c) => {
    return c.json(
      {
        error: 'Not Found',
      },
      404,
    );
  });

  app.onError((error, c) => {
    console.error(error);

    return c.json(
      {
        error: 'Internal Server Error',
      },
      500,
    );
  });

  return app;
}

export const app = createApp();
export type AppType = typeof app;
