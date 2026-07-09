import { auth } from '../auth/auth.js';
import { env } from '../config/env.js';
import { closeDatabase } from '../db/client.js';
import type { UserRole } from '../db/schema/auth.js';
import { createNotesService } from '../notes/notes-service.js';
import type { AppUser } from '../users/users-repository.js';
import { createUsersService } from '../users/users-service.js';

type SeedUser = {
  demoNote: {
    body: string;
    title: string;
  };
  email: string;
  name: string;
  password: string;
  role: UserRole;
};

const seedUsers = [
  {
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com',
    name: process.env.SEED_ADMIN_NAME ?? 'Admin User',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'password1234',
    role: 'admin',
    demoNote: {
      title: 'Admin demo note',
      body: 'Seeded local note for checking admin authentication flows.',
    },
  },
  {
    email: process.env.SEED_MEMBER_EMAIL ?? 'member@example.com',
    name: process.env.SEED_MEMBER_NAME ?? 'Member User',
    password: process.env.SEED_MEMBER_PASSWORD ?? 'password1234',
    role: 'member',
    demoNote: {
      title: 'Member demo note',
      body: 'Seeded local note for checking member authentication flows.',
    },
  },
] satisfies SeedUser[];

const usersService = createUsersService();
const notesService = createNotesService();

async function ensureSeedUser(seedUser: SeedUser): Promise<AppUser> {
  const existingUser = await usersService.findByEmail(seedUser.email);

  if (!existingUser) {
    await auth.api.signUpEmail({
      body: {
        email: seedUser.email,
        name: seedUser.name,
        password: seedUser.password,
      },
    });
  }

  await usersService.updateRoleByEmail(seedUser.email, seedUser.role);

  const user = await usersService.findByEmail(seedUser.email);

  if (!user) {
    throw new Error(`Seed user was not found after creation: ${seedUser.email}`);
  }

  return user;
}

async function ensureDemoNote(userId: string, seedUser: SeedUser) {
  const notes = await notesService.listForUser(userId);
  const exists = notes.some((note) => note.title === seedUser.demoNote.title);

  if (exists) {
    return;
  }

  await notesService.createForUser(userId, seedUser.demoNote);
}

async function seed() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run seed data in production.');
  }

  for (const seedUser of seedUsers) {
    const user = await ensureSeedUser(seedUser);
    await ensureDemoNote(user.id, seedUser);
  }
}

try {
  await seed();
  console.log('Seeded admin/member users and demo notes.');
} finally {
  await closeDatabase();
}
