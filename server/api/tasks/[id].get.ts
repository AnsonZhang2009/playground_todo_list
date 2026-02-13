import { useDb } from '#server/utils/useDb'
import {eq} from "drizzle-orm/sql/expressions/conditions";
import {todo} from "#server/db/schema";
import {CalendarDate} from "@internationalized/date";

function convertJSDate(jsDate: Date): CalendarDate {
	const year = jsDate.getUTCFullYear()
	const month = jsDate.getUTCMonth() + 1
	const day = jsDate.getUTCDate()
	return new CalendarDate(year, month, day)
}

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const db = useDb()

	if (!id) {
		throw createError({
			statusCode: 404,
			message: 'Missing id parameter'
		})
	}

	const fetchedTask = await db.query.todo.findFirst({
		where: eq(todo.id, parseInt(id)),
	})

	if (!fetchedTask) {
		throw createError({
			statusCode: 404,
			message: 'Task not found'
		})
	}
	return {
		id: fetchedTask.id,
		title: fetchedTask.title,
		description: fetchedTask.description,
		completed: fetchedTask.completed,
		dueDate: convertJSDate(fetchedTask.dueDate),
	}
})
