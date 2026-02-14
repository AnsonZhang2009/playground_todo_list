import {todo} from "#server/db/schema";

export type Task = typeof todo.$inferSelect;
export type NewTask = typeof todo.$inferInsert;
