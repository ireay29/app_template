import { forbiddenResponseSchema, unauthorizedResponseSchema } from '../routes/auth-responses.js';
import type { AppEnv, AuthorizedPrincipal } from '../types.js';

export const routeAccessLevels = ['public', 'authenticated', 'admin'] as const;
export type RouteAccess = (typeof routeAccessLevels)[number];

export type RouteAccessEnv<A extends RouteAccess> = A extends 'public'
  ? AppEnv
  : {
      Variables: {
        principal: A extends 'admin'
          ? AuthorizedPrincipal & { role: 'admin' }
          : AuthorizedPrincipal;
      };
    };

export function assertRouteAccess(access: RouteAccess): void {
  if (!routeAccessLevels.includes(access)) {
    throw new Error('Every route must declare public, authenticated, or admin access.');
  }
}

export function accessResponses(access: RouteAccess) {
  if (access === 'public') return {};
  const unauthorized = {
    description: 'Authentication is required.',
    content: { 'application/json': { schema: unauthorizedResponseSchema } },
  };
  if (access === 'authenticated') return { 401: unauthorized };
  return {
    401: unauthorized,
    403: {
      description: 'The current user does not have the required role.',
      content: { 'application/json': { schema: forbiddenResponseSchema } },
    },
  };
}
