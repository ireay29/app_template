import 'dotenv/config';

import { z } from 'zod';

const fallbackSecret = 'dev-secret-change-me-32-characters-min';
const requiredProductionEnv = ['DATABASE_URL', 'BETTER_AUTH_URL', 'WEB_ORIGIN'] as const;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8787),
    HOST: z.string().min(1).default('0.0.0.0'),
    DATABASE_URL: z
      .string()
      .url()
      .default('postgres://app_template:app_template@localhost:15432/app_template'),
    DATABASE_MIGRATION_URL: z.string().url().optional(),
    BETTER_AUTH_SECRET: z.string().min(32).default(fallbackSecret),
    BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
    WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production') {
      for (const name of requiredProductionEnv) {
        if (!process.env[name]) {
          context.addIssue({
            code: 'custom',
            path: [name],
            message: `${name} must be set in production.`,
          });
        }
      }
    }

    if (value.NODE_ENV === 'production' && value.BETTER_AUTH_SECRET === fallbackSecret) {
      context.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_SECRET'],
        message: 'BETTER_AUTH_SECRET must be set in production.',
      });
    }

    if (value.NODE_ENV === 'production') {
      for (const name of ['BETTER_AUTH_URL', 'WEB_ORIGIN'] as const) {
        const url = new URL(value[name]);

        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          context.addIssue({
            code: 'custom',
            path: [name],
            message: `${name} must not use a localhost origin in production.`,
          });
        }
      }
    }
  });

export const env = envSchema.parse(process.env);
export const databaseMigrationUrl = env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL;

function getLocalhostPair(origin: string): string[] {
  const url = new URL(origin);

  if (url.hostname === 'localhost') {
    url.hostname = '127.0.0.1';
    return [url.toString().replace(/\/$/, '')];
  }

  if (url.hostname === '127.0.0.1') {
    url.hostname = 'localhost';
    return [url.toString().replace(/\/$/, '')];
  }

  return [];
}

export const webOrigins = Array.from(
  new Set(
    [
      env.WEB_ORIGIN,
      env.BETTER_AUTH_URL,
      ...(env.NODE_ENV === 'production'
        ? []
        : [
            `http://localhost:${env.PORT}`,
            `http://127.0.0.1:${env.PORT}`,
            ...getLocalhostPair(env.WEB_ORIGIN),
            ...getLocalhostPair(env.BETTER_AUTH_URL),
            'http://localhost:*',
            'http://127.0.0.1:*',
            'http://127.0.0.1:3000',
          ]),
    ].filter(Boolean),
  ),
);
