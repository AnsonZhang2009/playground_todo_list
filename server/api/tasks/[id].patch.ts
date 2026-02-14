import { useDb } from '#server/utils/useDb'
import { eq } from 'drizzle-orm'
import {todo} from "#server/db/schema";
import { z } from 'zod'
import {useServerTasks} from "#server/utils/useServerTasks";
import type {NewTask, Task} from "#shared/types/db";

const routeSchema = z.object({
	id: z.coerce.number()
})

const bodySchema = z.custom<NewTask>()

export default defineEventHandler(async (event) => {
	const { id } = await getValidatedRouterParams(event, routeSchema.parse)
	const data = await readValidatedBody(event, bodySchema.parse)
	const { id: taskId, ...safeData } = data
	const $tasks = useServerTasks()

	return await $tasks.updateTask({ id, ...safeData })
})
