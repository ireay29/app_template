import { z } from '@hono/zod-openapi';

import { userRoles } from '../db/schema/auth.js';

export const userRoleSchema = z.enum(userRoles).openapi({ example: 'member' });

export const unauthorizedResponseSchema = z.object({
  error: z.literal('Unauthorized').openapi({ example: 'Unauthorized' }),
});

export const forbiddenResponseSchema = z.object({
  error: z.literal('Forbidden').openapi({ example: 'Forbidden' }),
});
