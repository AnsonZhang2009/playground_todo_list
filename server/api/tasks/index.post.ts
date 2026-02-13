	import { useDb } from '#server/utils/useDb'
	import { type CalendarDate } from '@internationalized/date'
	import { todo } from '#server/db/schema'
	import * as z from 'zod'

	const bodySchema = z.object({
		title: z.string('Title is required').min(1, 'Must be at least 1 character'),
		description: z.string().optional(),
		due: z.custom<CalendarDate>(),
		completed: z.boolean()
	})

	export default defineEventHandler(async (event) => {
		const db = useDb()
		const body = await readValidatedBody(event, bodySchema.parse)

		const utcDate = new Date(Date.UTC(
			body.due.year,
			body.due.month - 1, // months are 0-indexed in JS Date
			body.due.day,
			0, 0, 0, 0
		))

		await db.insert(todo).values({
			title: body.title,
			description: body.description,
			completed: body.completed,
			dueDate: utcDate,
		})
	})
