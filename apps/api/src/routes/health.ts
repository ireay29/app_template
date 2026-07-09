import { createRoute, z } from '@hono/zod-openapi';

const healthResponseSchema = z.object({
  status: z.literal('ok').openapi({
    example: 'ok',
  }),
  service: z.string().openapi({
    example: 'api',
  }),
  uptime: z.number().openapi({
    example: 12.34,
  }),
});

const readyResponseSchema = healthResponseSchema.extend({
  database: z.enum(['ok', 'unavailable']).openapi({
    example: 'ok',
  }),
});

export const healthRoute = createRoute({
  method: 'get',
  path: '/api/health',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: healthResponseSchema,
        },
      },
      description: 'Returns API health status.',
    },
  },
  tags: ['System'],
});

export const readyRoute = createRoute({
  method: 'get',
  path: '/api/ready',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: readyResponseSchema,
        },
      },
      description: 'Returns API readiness status, including database connectivity.',
    },
    503: {
      content: {
        'application/json': {
          schema: readyResponseSchema,
        },
      },
      description: 'Returns unavailable readiness status when a dependency is down.',
    },
  },
  tags: ['System'],
});
