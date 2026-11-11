import { OpenAPIHono } from '@hono/zod-openapi';
import { vi } from 'vitest';

import type { AppDependencies } from '../app-dependencies.js';
import { getMaintenanceSettings } from '../config/maintenance.js';
import { createRouteRegistry } from '../http/route-registry.js';
import type { AppEnv, AuthSession } from '../types.js';
import type { AppUser } from '../users/users-repository.js';

export function createAccessFixture() {
  const now = new Date();
  const user: AppUser = {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: false,
    image: null,
    role: 'member',
    createdAt: now,
    updatedAt: now,
  };
  const session: AuthSession = {
    user: { ...user },
    session: {
      id: 'test-session',
      token: 'dummy-token',
      userId: user.id,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 60_000),
    },
  };
  const getSession = vi.fn<AppDependencies['getSession']>(async () => null);
  const handleAuth = vi.fn(() => new Response('delegated auth'));
  const requireById = vi.fn(async () => user);
  const dependencies: AppDependencies = {
    checkDatabase: vi.fn(async () => undefined),
    getSession,
    handleAuth,
    usersService: {
      requireById,
      findByEmail: vi.fn(async () => null),
      updateRoleByEmail: vi.fn(async () => undefined),
    },
    notesService: {
      createForUser: vi.fn(async () => {
        throw new Error('Unexpected note mutation.');
      }),
      listForUser: vi.fn(async () => []),
    },
  };
  const app = new OpenAPIHono<AppEnv>();
  const registry = createRouteRegistry(app, dependencies, {
    webOrigins: ['http://localhost:3000'],
    maintenance: getMaintenanceSettings(),
  });
  app.onError(() => new Response('Internal Server Error', { status: 500 }));
  return { app, registry, dependencies, user, session, getSession, handleAuth, requireById };
}
