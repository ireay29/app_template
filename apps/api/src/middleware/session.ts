import { createMiddleware } from 'hono/factory';

import type { AppDependencies } from '../app-dependencies.js';
import { forbiddenBody, unauthorizedBody } from '../http/presenters.js';
import type { RouteAccess } from '../http/route-access.js';
import type { AppEnv } from '../types.js';

export function authorize(access: RouteAccess, dependencies: AppDependencies) {
  return createMiddleware<AppEnv>(async (c, next) => {
    if (access === 'public') {
      return next();
    }

    const authSession = await dependencies.getSession(c.req.raw.headers);
    if (!authSession) {
      return c.json(unauthorizedBody, 401);
    }

    const currentUser = await dependencies.usersService.requireById(authSession.user.id);
    if (access === 'admin' && currentUser.role !== 'admin') {
      return c.json(forbiddenBody, 403);
    }

    c.set('principal', { authSession, role: currentUser.role });
    return next();
  });
}
