import {todo} from '#server/db/schema'
import {useDb} from "#server/utils/useDb";
import {eq, SQL, inArray, lte, gte, ilike, and} from "drizzle-orm";
import {GetTasksOptions} from "#shared/types/fetch";
import type {NewTask, Task} from "#shared/types/db";

/*
TODO: Commentary

Type-32: This is a server utility composable specifically for managing your tasks. In larger projects, we prefer the
ideology similar to Java: write once, run everywhere.

I used JetBrains AI Assistant to write the JSDocs of the functions in the composable. If you have the plugin installed,
select the function and Alt+Enter. But do remember that you should write the documentation of the function AFTER you've
finished implementing it.
 */


/**
 * Provides server-side task management functions for CRUD operations.
 * Each function interacts with the database to perform specific task-related actions.
 */
export function useServerTasks() {
	const $db = useDb()

	/**
	 * Creates a new task in the database.
	 * @param values - The data for the new task, excluding the ID which is automatically handled.
	 * @return A promise that resolves to the created task object, or undefined if creation fails.
	 */
	async function createTask(values: NewTask): Promise<Task | undefined> {
		const { id, dueDate, ...safeValues } = values
		const [result] = await $db.insert(todo)
			.values({
				...safeValues,
				dueDate: dueDate ? new Date(dueDate) : null
			})
			.returning()

		return result
	}

	/**
	 * Retrieves a single task from the database by its unique identifier.
	 *
	 * @param taskId The unique numeric identifier of the task to retrieve.
	 * @return A Promise that resolves to the found Task object, or undefined if no task matches the given ID.
	 */
	async function getTask(taskId: number): Promise<Task | undefined> {
		return await $db.query.todo.findFirst({
			where: eq(todo.id, taskId)
		})
	}

	/**
	 * Deletes tasks from the database based on the provided task IDs.
	 *
	 * @param taskIds An array of numeric identifiers for the tasks to be deleted.
	 * @return A promise that resolves to an array of the deleted Task objects.
	 */
	async function deleteTasks(taskIds: number[]): Promise<Task[]> {
		return $db.delete(todo)
			.where(inArray(todo.id, taskIds))
			.returning();
	}

	/**
	 * Updates an existing task with the provided values.
	 *
	 * @param values - An object containing the task ID and the new values to update.
	 * @returns A promise that resolves to the updated task object if successful, or undefined if no task was found.
	 */
	async function updateTask(values: NewTask): Promise<Task | undefined> {
		const { id, dueDate, ...safeValues } = values
		if (!id)
			throw createError({
				status: 403,
				statusText: 'Missing Task ID parameter'
			})

		const [result] = await $db.update(todo)
			.set({
				...safeValues,
				dueDate: dueDate ? new Date(dueDate) : null
			})
			.where(eq(todo.id, id))
			.returning()

		return result
	}

	/**
	 * Retrieves tasks from the database based on the provided filtering options.
	 * @param options Optional parameters to filter the tasks by completion status, date range, title, or ID.
	 * @return A promise that resolves to an array of tasks matching the specified conditions.
	 */
	async function getTasks(options?: GetTasksOptions): Promise<Task[]> {
		const conditions: SQL[] = []

		if (options) {
			if (options.completed !== undefined)
				conditions.push(eq(todo.completed, options.completed))

			if (options.dateRangeStart)
				conditions.push(gte(todo.dueDate, options.dateRangeStart))

			if (options.dateRangeEnd)
				conditions.push(lte(todo.dueDate, options.dateRangeEnd))

			if (options.title) {
				if (options.exactTitle !== undefined && options.exactTitle)
					conditions.push(eq(todo.title, options.title))
				else
					conditions.push(ilike(todo.title, `%${options.title}%`))
			}

			if (options.id)
				conditions.push(eq(todo.id, options.id))
		}

		return await $db.query.todo.findMany({
			where: and(...conditions)
		})
	}

	return {
		createTask,
		getTask,
		deleteTasks,
		getTasks,
		updateTask
	}
}
