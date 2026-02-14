import type { GetTasksOptions } from '#shared/types/fetch'
import type { NewTask, Task } from '#shared/types/db'
import {useTasks} from "~/composables/core/useTasks";

export function useTasksStore() {
	const { getTasks, getTask, updateTask, deleteTasks, createTasks } = useTasks()

	const tasks = useState<Task[]>('tasks', () => [])
	const loading = useState<boolean>('tasks-loading', () => false)
	const error = useState<string | null>('tasks-error', () => null)

	/**
	 * Fetch all tasks (with optional filters) from the API
	 */
	async function fetchAll(options?: GetTasksOptions) {
		loading.value = true
		error.value = null
		try {
			tasks.value = await getTasks(options)
		} catch (e: any) {
			error.value = e?.data?.message || 'Failed to fetch tasks'
			console.error('Failed to fetch tasks:', e)
		} finally {
			loading.value = false
		}
	}

	/**
	 * Fetch a single task by id (detailed view)
	 */
	async function fetchOne(id: number) {
		error.value = null
		try {
			return await getTask(id)
		} catch (e: any) {
			error.value = e?.data?.message || 'Failed to fetch task'
			console.error('Failed to fetch task:', e)
			throw e
		}
	}

	function fetchLocalOne(id: number) {
		return unref(tasks).find(i => i.id === id)
	}

	/**
	 * Create a new task
	 * Optimistic: immediately appends a temporary task, replaces with server response on success
	 */
	async function create(newTask: NewTask) {
		error.value = null

		const tempId = -Date.now()
		const optimistic: Task = {
			id: tempId,
			title: newTask.title,
			description: newTask.description ?? null,
			completed: newTask.completed ?? false,
			dueDate: newTask.dueDate ?? new Date(),
		}

		tasks.value = [...tasks.value, optimistic]

		try {
			const created = await createTasks(newTask)
			tasks.value = tasks.value.map((t) => (t.id === tempId ? created! : t))
			return created
		} catch (e: any) {
			tasks.value = tasks.value.filter((t) => t.id !== tempId)
			error.value = e?.data?.message || 'Failed to create task'
			console.error('Failed to create task:', e)
			throw e
		}
	}

	/**
	 * Update an existing task
	 * Optimistic: immediately patches local state, rolls back on failure
	 */
	async function update(id: number, updates: Partial<NewTask>) {
		error.value = null

		const previous = tasks.value.find((t) => t.id === id)
		if (!previous) return

		tasks.value = tasks.value.map((t) =>
			t.id === id ? { ...t, ...updates } : t
		)

		try {
			const updated = await updateTask(id, updates)
			tasks.value = tasks.value.map((t) => (t.id === id ? updated! : t))
			return updated
		} catch (e: any) {
			tasks.value = tasks.value.map((t) => (t.id === id ? previous : t))
			error.value = e?.data?.message || 'Failed to update task'
			console.error('Failed to update task:', e)
			throw e
		}
	}

	/**
	 * Toggle completion
	 * Optimistic: flips the boolean immediately
	 */
	async function toggle(id: number) {
		const task = tasks.value.find((t) => t.id === id)
		if (!task) return
		return update(id, { ...task, completed: !task.completed })
	}

	/**
	 * Delete a task
	 * Optimistic: removes from list immediately, re-inserts on failure
	 */
	async function remove(id: number) {
		error.value = null

		const previous = tasks.value.slice()
		tasks.value = tasks.value.filter((t) => t.id !== id)

		try {
			await deleteTasks(id)
		} catch (e: any) {
			tasks.value = previous
			error.value = e?.data?.message || 'Failed to delete task'
			console.error('Failed to delete task:', e)
			throw e
		}
	}

	const completedTasks = computed(() => tasks.value.filter((t) => t.completed))
	const pendingTasks = computed(() => tasks.value.filter((t) => !t.completed))
	const taskCount = computed(() => tasks.value.length)

	return {
		tasks: readonly(tasks),
		loading: readonly(loading),
		error: readonly(error),

		completedTasks,
		pendingTasks,
		taskCount,

		fetchAll,
		fetchOne,
		fetchLocalOne,
		create,
		update,
		toggle,
		remove,
	}
}
