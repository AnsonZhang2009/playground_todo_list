import {useDb} from '#server/utils/useDb'
import * as z from 'zod'
import type {GetTasksOptions} from "#shared/types/fetch";
import {useServerTasks} from "#server/utils/useServerTasks";

const querySchema = z.custom<GetTasksOptions>().optional()

/*
TODO: Commentary

Type-32: Query options are cool because they're mostly optional and that when we need to have certain conditions, we can
fill in parts of the options and get the specific list of data we want. This acts as a kind of defensive programming
where you add the utility features ahead of time (as a side-task of implementing the main task) in case if you need it
in the future without needing to re-implement it again.
 */

export default defineEventHandler(async (event) => {
	const options = await getValidatedQuery(event, querySchema.parse)
	const $tasks = useServerTasks()

	return await $tasks.getTasks(options)
})
