import type { auth } from './auth/auth.js';

export type AuthSession = typeof auth.$Infer.Session;

export type AppEnv = {
  Variables: {
    user: AuthSession['user'] | null;
    session: AuthSession['session'] | null;
  };
};
