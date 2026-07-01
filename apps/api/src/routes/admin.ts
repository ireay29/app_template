import { createRoute, z } from '@hono/zod-openapi';

import { forbiddenResponseSchema, unauthorizedResponseSchema } from './auth-responses.js';

const adminSummaryResponseSchema = z.object({
  message: z.string().openapi({ example: 'Admin API access granted.' }),
  role: z.literal('admin').openapi({ example: 'admin' }),
});

export const adminSummaryRoute = createRoute({
  method: 'get',
  path: '/api/admin/summary',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: adminSummaryResponseSchema,
        },
      },
      description: 'Returns an admin-only API example response.',
    },
    401: {
      content: {
        'application/json': {
          schema: unauthorizedResponseSchema,
        },
      },
      description: 'Authentication is required.',
    },
    403: {
      content: {
        'application/json': {
          schema: forbiddenResponseSchema,
        },
      },
      description: 'The current user does not have the required role.',
    },
  },
  tags: ['Admin'],
});
