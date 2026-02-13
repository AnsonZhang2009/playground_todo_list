import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core'

export const todo = sqliteTable('todo', {
	id: integer({mode: 'number'}).unique().primaryKey({autoIncrement: true}),
	title: text().notNull(),
	description: text(),
	completed: integer({ mode: 'boolean' }),
	dueDate: integer('due_date', {mode: 'timestamp_ms'}).default(new Date()).$defaultFn(() => new Date()).notNull(),
})

export type Task = typeof todo.$inferSelect;
export type NewTask = typeof todo.$inferInsert;
