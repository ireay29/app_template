import { createRoute, z } from '@hono/zod-openapi';

const userSchema = z.object({
  id: z.string().openapi({ example: 'user_123' }),
  email: z.string().email().openapi({ example: 'avery@example.com' }),
  name: z.string().openapi({ example: 'Avery' }),
  image: z.string().nullable().openapi({ example: null }),
});

const sessionSchema = z.object({
  id: z.string().openapi({ example: 'session_123' }),
  expiresAt: z.string().datetime().openapi({ example: '2026-07-01T00:00:00.000Z' }),
});

export const unauthorizedResponseSchema = z.object({
  error: z.literal('Unauthorized').openapi({ example: 'Unauthorized' }),
});

export const meResponseSchema = z.object({
  user: userSchema,
  session: sessionSchema,
});

export const meRoute = createRoute({
  method: 'get',
  path: '/api/me',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: meResponseSchema,
        },
      },
      description: 'Returns the current authenticated user and session.',
    },
    401: {
      content: {
        'application/json': {
          schema: unauthorizedResponseSchema,
        },
      },
      description: 'Authentication is required.',
    },
  },
  tags: ['Auth'],
});
