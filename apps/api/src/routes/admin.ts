import { createRoute, z } from '@hono/zod-openapi';

import { maintenanceUnavailableResponse } from './maintenance.js';

const adminSummaryResponseSchema = z.object({
  message: z.string().openapi({ example: 'Admin API access granted.' }),
  role: z.literal('admin').openapi({ example: 'admin' }),
});

export const adminSummaryRoute = createRoute({
  method: 'get',
  path: '/api/admin/summary',
  responses: {
    503: maintenanceUnavailableResponse,
    200: {
      content: {
        'application/json': {
          schema: adminSummaryResponseSchema,
        },
      },
      description: 'Returns an admin-only API example response.',
    },
  },
  tags: ['Admin'],
});
