import type {GetTasksOptions} from "#shared/types/fetch";
import type {NewTask, Task} from "#shared/types/db";

export function useTasks() {
	async function getTasks(options?: GetTasksOptions) {
		return (await $fetch<Task[]>('/api/tasks', {
			method: 'get',
			query: options
		})).map(i => ({
			...i,
			dueDate: i.dueDate ? new Date(i.dueDate) : null
		}))
	}

	async function getTask(taskId: number) {
		return await $fetch<Task | undefined>(`/api/tasks/${taskId}`, {
			method: 'get'
		})
	}

	async function updateTask(taskId: number, values: Partial<NewTask>) {
		return await $fetch<Task | undefined>(`/api/tasks/${taskId}`, {
			method: 'patch',
			body: {
				...values,
				id: taskId
			}
		})
	}

	async function deleteTasks(taskId: number) {
		return await $fetch<Task[]>(`/api/tasks/${taskId}`, {
			method: 'delete',
		})
	}

	async function createTasks(values: NewTask) {
		return await $fetch<Task | undefined>('/api/tasks', {
			method: 'post',
			body: values
		})
	}

	return {
		getTask,
		getTasks,
		updateTask,
		deleteTasks,
		createTasks
	}
}
