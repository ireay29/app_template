import { auth } from './auth/auth.js';
import { checkDatabase } from './db/client.js';
import { createNotesService, type NotesService } from './notes/notes-service.js';

export type AppDependencies = {
  checkDatabase: () => Promise<void>;
  handleAuth: (request: Request) => Response | Promise<Response>;
  notesService: NotesService;
};

export function createDefaultAppDependencies(): AppDependencies {
  return {
    checkDatabase,
    handleAuth: (request) => auth.handler(request),
    notesService: createNotesService(),
  };
}
