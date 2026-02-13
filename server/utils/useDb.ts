import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from '#server/db/schema'

export function useDb() {
	const sqlite = new Database('./sqlite.db'); // path to your SQLite file
	return drizzle(sqlite, { schema });
}
