import { useDb } from '#server/utils/useDb'
import {todo} from '#server/db/schema'
import { z } from 'zod'
import {useServerTasks} from "#server/utils/useServerTasks";
import type {NewTask} from "#shared/types/db";

const bodySchema = z.custom<NewTask>()

export default defineEventHandler(async (event) => {
	const data = await readValidatedBody(event, bodySchema.parse)
	const $tasks = useServerTasks()

	return await $tasks.createTask(data)
})
