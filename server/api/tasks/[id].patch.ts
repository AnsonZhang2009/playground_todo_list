import { useDb } from '#server/utils/useDb'
import { eq } from 'drizzle-orm'
import { todo } from "#server/db/schema";
import { type CalendarDate, getLocalTimeZone } from '@internationalized/date'
import * as z from 'zod'

const bodySchema = z.object({
	title: z.string('Title is required').min(1, 'Must be at least 1 character'),
	description: z.string().optional(),
	due: z.custom<CalendarDate>(),
	completed: z.boolean()
})

export default defineEventHandler(async (event) => {
	const id = getRouterParam(event, 'id')
	const body = await readValidatedBody(event, bodySchema.parse)
	const utcDate = new Date(Date.UTC(
		body.due.year,
		body.due.month - 1, // months are 0-indexed in JS Date
		body.due.day,
		0, 0, 0, 0
	))
	const db = useDb()

	if (!id) {
		throw createError({
			statusCode: 404,
			message: 'Missing id parameter'
		})
	}

	try {
		await db.update(todo)
			.set({
				title: body.title,
				description: body.description,
				completed: body.completed,
				dueDate: utcDate,
			})
			.where(eq(todo.id, parseInt(id)))
	} catch (error) {
		throw createError({
			statusCode: 500,
			message: 'Failed to update todo'
		})
	}
})
