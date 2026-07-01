import { createRoute, z } from '@hono/zod-openapi';

import { unauthorizedResponseSchema } from './auth-responses.js';

export const noteSchema = z.object({
  id: z.string().uuid().openapi({ example: '01234567-89ab-cdef-0123-456789abcdef' }),
  title: z.string().openapi({ example: 'First note' }),
  body: z.string().nullable().openapi({ example: 'A small authenticated demo note.' }),
  createdAt: z.string().datetime().openapi({ example: '2026-06-30T00:00:00.000Z' }),
  updatedAt: z.string().datetime().openapi({ example: '2026-06-30T00:00:00.000Z' }),
});

export const notesResponseSchema = z.object({
  notes: z.array(noteSchema),
});

export const createNoteRequestSchema = z.object({
  title: z.string().trim().min(1).max(120).openapi({ example: 'First note' }),
  body: z.string().trim().max(2000).optional().openapi({ example: 'A short note body.' }),
});

export const getNotesRoute = createRoute({
  method: 'get',
  path: '/api/notes',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: notesResponseSchema,
        },
      },
      description: 'Returns notes owned by the current user.',
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
  tags: ['Notes'],
});

export const createNoteRoute = createRoute({
  method: 'post',
  path: '/api/notes',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createNoteRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: z.object({ note: noteSchema }),
        },
      },
      description: 'Creates a note owned by the current user.',
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
  tags: ['Notes'],
});
