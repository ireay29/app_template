import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { env, webOrigins } from '../config/env.js';
import { db } from '../db/client.js';
import * as schema from '../db/schema/index.js';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: webOrigins,
  advanced: {
    disableOriginCheck: env.NODE_ENV !== 'production',
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
});
