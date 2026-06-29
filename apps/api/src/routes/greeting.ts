import { createRoute, z } from '@hono/zod-openapi';

const greetingQuerySchema = z.object({
  name: z.string().min(1).optional().openapi({
    example: 'Avery',
  }),
});

const greetingResponseSchema = z.object({
  message: z.string().openapi({
    example: 'Hello, Avery.',
  }),
});

export const greetingRoute = createRoute({
  method: 'get',
  path: '/api/greeting',
  request: {
    query: greetingQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: greetingResponseSchema,
        },
      },
      description: 'Returns a greeting.',
    },
  },
  tags: ['Examples'],
});
