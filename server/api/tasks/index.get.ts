import { useDb } from '#server/utils/useDb'
import { CalendarDate } from '@internationalized/date';
import { eq, and, SQL } from 'drizzle-orm';
import { todo } from '#server/db/schema';
import * as z from 'zod'

function convertJSDate(jsDate: Date): CalendarDate {
	const year = jsDate.getUTCFullYear()
	const month = jsDate.getUTCMonth() + 1
	const day = jsDate.getUTCDate()
	return new CalendarDate(year, month, day)
}

const querySchema = z.object({
	title: z.string().optional(),
	dateURL: z.string().optional(),
	completed: z.string().optional().transform((v) => v === 'true'),
})

export default defineEventHandler(async (event) => {
	const db = useDb()
	const {title, dateURL, completed} = await getValidatedQuery(event, querySchema.parse)

	const conditions: SQL[] = []

	if (title) {
		conditions.push(eq(todo.title, title))
	}

	if (dateURL) {
		const [year, month, day] = dateURL.split('-').map(Number)

		if (!year || !month || !day) {
			throw createError({
				statusCode: 404,
				message: 'Wrong date parameter'
			})
		}

		const utcDate = new Date(Date.UTC(
			year,
			month - 1, // months are 0-indexed in JS Date
			day,
			0, 0, 0, 0
		))

		conditions.push(eq(todo.dueDate, utcDate))
	}

	if (completed !== undefined) {
		conditions.push(eq(todo.completed, completed))
	}

	const tasks = await db.query.todo.findMany({
		where: conditions.length > 0 ? and(...conditions) : undefined
	})

	return tasks.map((i) => ({
		...i,
		dueDate: convertJSDate(i.dueDate),
	}))
})
