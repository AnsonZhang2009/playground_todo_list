import {integer, sqliteTable, text} from 'drizzle-orm/sqlite-core'

export const todo = sqliteTable('todo', {
	id: integer({mode: 'number'}).unique().primaryKey({autoIncrement: true}),
	title: text().notNull(),
	description: text(),
	completed: integer({ mode: 'boolean' }).notNull().default(false).$defaultFn(() => false),
	dueDate: integer('due_date', {mode: 'timestamp_ms'}).default(new Date()).$defaultFn(() => new Date()),
})
