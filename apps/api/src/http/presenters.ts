import type { Note } from '../db/schema/notes.js';
import type { AuthSession } from '../types.js';

export const unauthorizedBody = { error: 'Unauthorized' } as const;

export function toMeResponse({ user, session }: AuthSession) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image ?? null,
    },
    session: {
      id: session.id,
      expiresAt: session.expiresAt.toISOString(),
    },
  };
}

export function toNoteResponse(note: Note) {
  return {
    id: note.id,
    title: note.title,
    body: note.body ?? null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}
