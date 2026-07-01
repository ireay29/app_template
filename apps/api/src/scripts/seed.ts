import { auth } from '../auth/auth.js';
import { env } from '../config/env.js';
import { closeDatabase } from '../db/client.js';
import type { UserRole } from '../db/schema/auth.js';
import { createUsersService } from '../users/users-service.js';

type SeedUser = {
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
  },
  {
    email: process.env.SEED_MEMBER_EMAIL ?? 'member@example.com',
    name: process.env.SEED_MEMBER_NAME ?? 'Member User',
    password: process.env.SEED_MEMBER_PASSWORD ?? 'password1234',
    role: 'member',
  },
] satisfies SeedUser[];

const usersService = createUsersService();

async function ensureSeedUser(seedUser: SeedUser) {
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
}

async function seed() {
  if (env.NODE_ENV === 'production') {
    throw new Error('Refusing to run seed data in production.');
  }

  for (const seedUser of seedUsers) {
    await ensureSeedUser(seedUser);
  }
}

try {
  await seed();
  console.log('Seeded admin and member users.');
} finally {
  await closeDatabase();
}
