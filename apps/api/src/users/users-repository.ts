import { eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import { user } from '../db/schema/index.js';

export type AppUser = typeof user.$inferSelect;

export type UsersRepository = {
  findByEmail(email: string): Promise<AppUser | null>;
  findById(id: string): Promise<AppUser | null>;
  updateRoleByEmail(email: string, role: AppUser['role']): Promise<void>;
};

export function createUsersRepository(): UsersRepository {
  return {
    async findByEmail(email) {
      const [record] = await db.select().from(user).where(eq(user.email, email)).limit(1);
      return record ?? null;
    },

    async findById(id) {
      const [record] = await db.select().from(user).where(eq(user.id, id)).limit(1);
      return record ?? null;
    },

    async updateRoleByEmail(email, role) {
      await db
        .update(user)
        .set({
          role,
          updatedAt: new Date(),
        })
        .where(eq(user.email, email));
    },
  };
}
