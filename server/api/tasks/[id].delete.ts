import { useDb } from '#server/utils/useDb'
import {eq} from "drizzle-orm/sql/expressions/conditions";
import {todo} from "#server/db/schema";

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const db = useDb()

	if (!id) {
		throw createError({
			statusCode: 404,
			message: 'Missing id parameter'
		})
	}

	if (id != null) {
		await db.delete(todo).where(eq(todo.id, parseInt(id)))
	}
})
