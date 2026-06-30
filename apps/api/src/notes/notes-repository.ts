import { desc, eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import { notes } from '../db/schema/index.js';
import type { Note } from '../db/schema/notes.js';

export type CreateNoteRecord = {
  userId: string;
  title: string;
  body?: string | null;
};

export type NotesRepository = {
  create(input: CreateNoteRecord): Promise<Note>;
  findByUserId(userId: string): Promise<Note[]>;
};

export function createNotesRepository(): NotesRepository {
  return {
    async create(input) {
      const [note] = await db
        .insert(notes)
        .values({
          userId: input.userId,
          title: input.title,
          body: input.body ?? null,
        })
        .returning();

      return note;
    },

    findByUserId(userId) {
      return db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
    },
  };
}
