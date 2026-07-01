import { type AppUser, createUsersRepository, type UsersRepository } from './users-repository.js';

export type UsersService = {
  findByEmail(email: string): Promise<AppUser | null>;
  requireById(id: string): Promise<AppUser>;
  updateRoleByEmail(email: string, role: AppUser['role']): Promise<void>;
};

export function createUsersService(
  repository: UsersRepository = createUsersRepository(),
): UsersService {
  return {
    findByEmail(email) {
      return repository.findByEmail(email);
    },

    async requireById(id) {
      const user = await repository.findById(id);

      if (!user) {
        throw new Error('Authenticated user record was not found.');
      }

      return user;
    },

    updateRoleByEmail(email, role) {
      return repository.updateRoleByEmail(email, role);
    },
  };
}
