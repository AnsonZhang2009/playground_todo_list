import { useDb } from '#server/utils/useDb'
import {eq} from "drizzle-orm/sql/expressions/conditions";
import {todo} from "#server/db/schema";
import { z } from 'zod'
import {useServerTasks} from "#server/utils/useServerTasks";
import type {Task} from "#shared/types/db";

const routeSchema = z.object({
	id: z.coerce.number()
})

/*
TODO: Commentary

Type-32: The reason we have separate endpoints for fetching the tasks and specific task is due to listing purposes.
In your use case, this might not be so necessary, as you only have one single table with no relations. However,
in use-cases with more relations, we might need to render a brief list of the specified data and a detailed page of the
specified data. So, for listing endpoints, we get the data en masse, and exclude its relations (which is default for
drizzle ORM). For specific endpoints, we get the specific data entry and include its relations, which leads us to gain
more details of the entry and return it for frontend to present.

In conclusion, it's about how you present the data: en masse as a list, or just a specific, detailed one.
 */

export default defineEventHandler(async (event) => {
	const { id } = await getValidatedRouterParams(event, routeSchema.parse)
	const $tasks = useServerTasks()

	return await $tasks.getTask(id)
})
