import { auth } from './auth/auth.js';
import { checkDatabase } from './db/client.js';
import { createNotesService, type NotesService } from './notes/notes-service.js';
import type { AuthSession } from './types.js';
import { createUsersService, type UsersService } from './users/users-service.js';

export type AppDependencies = {
  checkDatabase: () => Promise<void>;
  handleAuth: (request: Request) => Response | Promise<Response>;
  getSession: (headers: Headers) => Promise<AuthSession | null>;
  notesService: NotesService;
  usersService: UsersService;
};

export function createDefaultAppDependencies(): AppDependencies {
  return {
    checkDatabase,
    handleAuth: (request) => auth.handler(request),
    getSession: (headers) => auth.api.getSession({ headers }),
    notesService: createNotesService(),
    usersService: createUsersService(),
  };
}
