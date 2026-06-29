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
