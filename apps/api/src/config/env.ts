import 'dotenv/config';

import { z } from 'zod';

const fallbackSecret = 'dev-secret-change-me-32-characters-min';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(8787),
    DATABASE_URL: z
      .string()
      .url()
      .default('postgres://app_template:app_template@localhost:15432/app_template'),
    BETTER_AUTH_SECRET: z.string().min(32).default(fallbackSecret),
    BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
    WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production' && value.BETTER_AUTH_SECRET === fallbackSecret) {
      context.addIssue({
        code: 'custom',
        path: ['BETTER_AUTH_SECRET'],
        message: 'BETTER_AUTH_SECRET must be set in production.',
      });
    }
  });

export const env = envSchema.parse(process.env);

export const webOrigins = Array.from(
  new Set([env.WEB_ORIGIN, 'http://127.0.0.1:3000'].filter(Boolean)),
);
