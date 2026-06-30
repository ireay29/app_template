import type { Note } from '../db/schema/notes.js';
import { createNotesRepository, type NotesRepository } from './notes-repository.js';

export type CreateNoteInput = {
  title: string;
  body?: string;
};

export type NotesService = {
  createForUser(userId: string, input: CreateNoteInput): Promise<Note>;
  listForUser(userId: string): Promise<Note[]>;
};

export function createNotesService(
  repository: NotesRepository = createNotesRepository(),
): NotesService {
  return {
    createForUser(userId, input) {
      return repository.create({
        userId,
        title: input.title,
        body: input.body ?? null,
      });
    },

    listForUser(userId) {
      return repository.findByUserId(userId);
    },
  };
}
