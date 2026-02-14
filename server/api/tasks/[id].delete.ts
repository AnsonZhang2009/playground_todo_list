import { useDb } from '#server/utils/useDb'
import {eq} from "drizzle-orm/sql/expressions/conditions";
import {todo} from "#server/db/schema";
import { z } from 'zod'
import {useServerTasks} from "#server/utils/useServerTasks";

const routeSchema = z.object({
	id: z.coerce.number()
})

export default defineEventHandler(async (event) => {
	const { id } = await getValidatedRouterParams(event, routeSchema.parse)
	const $tasks = useServerTasks()

	return await $tasks.deleteTasks([id])
})
