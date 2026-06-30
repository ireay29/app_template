import { relations } from 'drizzle-orm';
import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { user } from './auth.js';

export const notes = pgTable(
  'notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 120 }).notNull(),
    body: text('body'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('notes_user_id_idx').on(table.userId),
    index('notes_created_at_idx').on(table.createdAt),
  ],
);

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(user, {
    fields: [notes.userId],
    references: [user.id],
  }),
}));

export type Note = typeof notes.$inferSelect;
