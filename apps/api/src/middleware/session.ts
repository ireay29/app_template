import type { Context } from 'hono';
import { createMiddleware } from 'hono/factory';

import { auth } from '../auth/auth.js';
import type { AppEnv, AuthSession } from '../types.js';

export const sessionContext = createMiddleware<AppEnv>(async (c, next) => {
  const authSession = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  c.set('user', authSession?.user ?? null);
  c.set('session', authSession?.session ?? null);

  await next();
});

export function requireAuth(c: Context<AppEnv>): AuthSession | null {
  const user = c.get('user');
  const session = c.get('session');

  if (!user || !session) {
    return null;
  }

  return { user, session };
}
