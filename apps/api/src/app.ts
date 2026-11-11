import { OpenAPIHono } from '@hono/zod-openapi';

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
import { createRouteRegistry } from './http/route-registry.js';
import type { AppEnv } from './types.js';

export function createApp(
  dependencies: AppDependencies = createDefaultAppDependencies(),
  maintenance: MaintenanceSettings = getMaintenanceSettings(env),
) {
  const app = new OpenAPIHono<AppEnv>();
  const registry = createRouteRegistry(app, dependencies, { webOrigins, maintenance });

  registerAuthRoutes(registry.routes, dependencies);
  registerAdminRoutes(registry.routes);
  registerSystemRoutes(registry.routes, dependencies, maintenance);
  registerNotesRoutes(registry.routes, dependencies);
  registerOpenApiDocs(registry.routes);
  registry.assertComplete();

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
