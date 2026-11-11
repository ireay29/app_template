import type { auth } from './auth/auth.js';
import type { UserRole } from './db/schema/auth.js';

export type AuthSession = typeof auth.$Infer.Session;

export type AuthorizedPrincipal = {
  authSession: AuthSession;
  role: UserRole;
};

export type AppEnv = {
  Variables: {
    principal?: AuthorizedPrincipal;
  };
};
