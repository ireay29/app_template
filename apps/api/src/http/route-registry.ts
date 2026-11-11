import { type OpenAPIHono, type RouteConfig, type RouteHandler } from '@hono/zod-openapi';
import type { Handler } from 'hono';
import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';
import { matchedRoutes } from 'hono/route';
import { timing } from 'hono/timing';
import type { RouterRoute } from 'hono/types';

import type { AppDependencies } from '../app-dependencies.js';
import type { MaintenanceSettings } from '../config/maintenance.js';
import { maintenanceGuard } from '../middleware/maintenance.js';
import { authorize } from '../middleware/session.js';
import type { AppEnv } from '../types.js';
import { forbiddenBody } from './presenters.js';
import {
  accessResponses,
  assertRouteAccess,
  type RouteAccess,
  type RouteAccessEnv,
} from './route-access.js';

type App = OpenAPIHono<AppEnv>;
type RegisteredAccess = RouteAccess | 'infrastructure';
const registryEntries = new WeakMap<App, Map<RouterRoute, RegisteredAccess>>();

/** Read-only inventory, including adapters absent from the OpenAPI document. */
export function getRouteAccessManifest(app: App) {
  const entries = registryEntries.get(app);
  if (!entries) throw new Error('The app has no route registry.');
  const manifest = new Map<string, { method: string; path: string; access: RouteAccess }>();
  for (const [route, access] of entries) {
    if (access === 'infrastructure') continue;
    const { method, path } = route;
    manifest.set(`${method} ${path} ${access}`, { method, path, access });
  }
  return [...manifest.values()].sort((a, b) =>
    `${a.method} ${a.path} ${a.access}`.localeCompare(`${b.method} ${b.path} ${b.access}`),
  );
}

type AccessRoute = RouteConfig & { middleware?: never };
type BoundaryConfig = {
  webOrigins: string[];
  maintenance: MaintenanceSettings;
};

/** Construct before any middleware or handlers so nothing is implicitly trusted. */
export function createRouteRegistry(
  app: App,
  dependencies: AppDependencies,
  config: BoundaryConfig,
) {
  if (app.routes.length !== 0) {
    throw new Error('Create the route registry before registering middleware or handlers.');
  }
  const registered = new Map<RouterRoute, RegisteredAccess>();
  registryEntries.set(app, registered);

  function capture(access: RegisteredAccess, register: () => void) {
    const start = app.routes.length;
    register();
    for (const route of app.routes.slice(start)) registered.set(route, access);
  }

  const declaredRoutesOnly = createMiddleware<AppEnv>(async (c, next) => {
    const accesses = new Set<RouteAccess>();
    for (const route of matchedRoutes(c)) {
      const access = registered.get(route);
      if (!access) return c.json(forbiddenBody, 403);
      if (access !== 'infrastructure') accesses.add(access);
    }
    // A public wildcard must never shadow a more restrictive route.
    if (accesses.size > 1) return c.json(forbiddenBody, 403);
    return next();
  });

  // This closed list is the only code allowed to respond before authorization.
  // Do not accept callbacks or expose a generic pre-authorization middleware API.
  capture('infrastructure', () => {
    app.use('*', declaredRoutesOnly);
    app.use('*', timing());
    app.use(
      '/api/*',
      cors({
        origin: config.webOrigins,
        credentials: true,
        allowHeaders: ['Content-Type', 'Authorization'],
        exposeHeaders: ['Retry-After'],
      }),
    );
    app.use('/api/*', maintenanceGuard(config.maintenance));
  });

  const routes = {
    openapi<R extends AccessRoute, A extends RouteAccess>(
      route: R,
      access: A,
      handler: RouteHandler<R, RouteAccessEnv<A>>,
    ) {
      assertRouteAccess(access);
      if (route.middleware) {
        throw new Error('Route middleware must not bypass the common authorization boundary.');
      }
      const configured: RouteConfig = {
        ...route,
        'x-access': access,
        responses: { ...route.responses, ...accessResponses(access) },
        middleware: [authorize(access, dependencies)],
      };
      capture(access, () => {
        // The preceding middleware establishes the handler's non-null principal.
        // Keep the original route's request/response inference at this adapter boundary.
        app.openapi(configured, handler as unknown as RouteHandler<RouteConfig, AppEnv>);
      });
    },

    on<A extends RouteAccess>(
      method: string | string[],
      path: string,
      access: A,
      handler: Handler<RouteAccessEnv<A>>,
    ) {
      assertRouteAccess(access);
      capture(access, () => {
        app.on(
          typeof method === 'string' ? [method] : method,
          [path],
          authorize(access, dependencies),
          handler as unknown as Handler<AppEnv>,
        );
      });
    },

    document(path: string, access: RouteAccess, config: Parameters<App['doc']>[1]) {
      assertRouteAccess(access);
      capture(access, () => {
        app.on('GET', path, authorize(access, dependencies));
        app.doc(path, config);
      });
    },
  };

  return {
    routes,
    assertComplete() {
      const undeclared = app.routes.filter((route) => !registered.has(route));
      if (undeclared.length) {
        throw new Error(
          `Undeclared route access: ${undeclared.map((r) => `${r.method} ${r.path}`).join(', ')}`,
        );
      }
    },
  };
}

export type RouteRegistrar = ReturnType<typeof createRouteRegistry>['routes'];
