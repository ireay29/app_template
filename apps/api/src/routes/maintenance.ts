import { createRoute, z } from '@hono/zod-openapi';

import { maintenanceModeSchema } from '../config/maintenance.js';

export const maintenanceStatusSchema = z
  .object({
    mode: maintenanceModeSchema,
    message: z.string(),
    retryAfterSeconds: z.number().int().min(1).max(86_400),
    endsAt: z.string().datetime({ offset: true }).nullable(),
    infoUrl: z.string().url().nullable(),
  })
  .openapi('MaintenanceStatus');

export const maintenanceUnavailableResponse = {
  description: 'Temporarily unavailable during maintenance. Retry-After indicates a retry delay.',
  headers: {
    'Retry-After': { schema: { type: 'string' as const }, description: 'Retry delay in seconds.' },
    'Cache-Control': { schema: { type: 'string' as const }, description: 'no-store' },
  },
  content: {
    'application/json': {
      schema: z.object({
        error: z.literal('Service Unavailable'),
        code: z.literal('MAINTENANCE'),
        maintenance: maintenanceStatusSchema,
      }),
    },
  },
};

export const maintenanceRoute = createRoute({
  method: 'get',
  path: '/api/maintenance',
  responses: {
    200: {
      description: 'Public maintenance status. Available in all modes without a database query.',
      content: { 'application/json': { schema: maintenanceStatusSchema } },
    },
  },
  tags: ['System'],
});
