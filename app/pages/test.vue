<script setup lang="ts">
import {defineShortcuts} from '#ui/composables/index.js'
import {today, getLocalTimeZone, type CalendarDate} from '@internationalized/date'
import {DetailsSlideover} from '#components'

const value = shallowRef(today(getLocalTimeZone()))
const open = ref(false)

const overlay = useOverlay()
const detailsSlideover = overlay.create(DetailsSlideover)

defineShortcuts({
	o: () => {
		open.value = !open.value
	}
})

const { data: tasks, refresh, pending } = await useFetch('/api/tasks', {
	method: 'GET'
})

const toggleCompleted = async (id: number) => {
	const task = unref(tasks)?.find(t => t.id == id)
	if (!task) return
	task.completed = !task.completed // Optimistic update
	try {
		await $fetch(`/api/tasks/${id}`, {
			method: 'PATCH',
			body: {
				title: task.title,
				description: task.description,
				due: task.dueDate,
				completed: task.completed
			}
		})
	} catch (e) {
		task.completed = !task.completed
		console.error('Failed to update task:', e)
	}
}

function openSlideover(id: number) {
	const task = tasks.value.find(t => t.id === id)
	if (!task) return
	detailsSlideover.open({
		titleRef: unref(task.title),
		descriptionRef: unref(task.description),
		dateRef: unref(task.dueDate),
		async onUpdate(payload) {
			task.title = payload.title // Optimistic update
			task.description = payload.description || task.description || '' // Optimistic update
			task.dueDate = payload.date // Optimistic update
			try {
				await $fetch(`/api/tasks/${id}`, {
					method: 'PATCH',
					body: {
						title: task.title,
						description: task.description,
						due: task.dueDate,
						completed: task.completed
					}
				})
			} catch (e) {
				console.error('Failed to update task:', e)
			}
		}
	})
}

function addNewTask() {
	const newTask = ref({
		taskName: 'Enter a task',
		description: 'Enter a description',
		completed: false,
		due: shallowRef(today(getLocalTimeZone()))
	})
	detailsSlideover.open({
		titleRef: unref(newTask.value.taskName),
		descriptionRef: unref(newTask.value.description),
		dateRef: unref(newTask.value.due),
		async onUpdate(payload) {
			try {
				const { task } = await $fetch(`/api/tasks/`, {
					method: 'POST',
					body: {
						title: payload.title,
						description: payload.description || newTask.value.description || '',
						due: payload.date,
						completed: false
					}
				})
				tasks.value.unshift(task) // Optimistic update
			} catch (e) {
				console.error('Failed to update task:', e)
			}
		}
	})
}

async function deleteTask(id: number) {
	try {
		await $fetch(`/api/tasks/${id}`, {
			method: 'DELETE'
		})
		tasks.value = tasks.value.filter(t => t.id !== id)
	} catch (e) {
		console.error('Failed to delete task:', e)
	}
}
</script>

<template>
	<div class="mx-20 py-2">
		<UPageHeader
			title="To Do List"
			description="A simple to do list created as a side project for Anson Zhang to learn more about Nuxt. "
			headline="New Release"
		/>
		<div class="fixed bottom-15 right-20 z-40">
			<UButton class="rounded-full" icon="i-lucide-plus" size="xl" @click="addNewTask"/>
		</div>
		<div class="mt-10">
			<UPageCard
				variant="soft"
				class="justify-center items-center"
			>
				<template #title>
					<div
						class="items-center flex gap-2 w-full"
					>
            <Span>
              <USlideover
				  v-model:open="open"
				  side="right"
				  inset
				  title="Select Date"
			  >
                <UButton
					icon="i-lucide-calendar"
					variant="ghost"
				/>
                <template #body>
                  <UCalendar v-model="value"/>
                </template>
              </USlideover>
            </Span>
						<Span>{{ value.toString() }}</Span>
					</div>
				</template>
			</UPageCard>
			<div class="my-2">
				<UPageList>
					<UPageCard
						v-for="task in tasks"
						:key="task.id"
						variant="ghost"
						:class="`my-1 hover:scale-99 duration-100 ${task.completed == true ? '' : 'hover:backdrop-brightness-98'}`"
					>
						<div @dblclick="openSlideover(task.id)">
							<div
								:class="`flex gap-2 w-full items-center ${task.completed == true ? 'brightness-10' : ''}`">
								<UButton
									:icon="`${task.completed == true ? 'i-lucide-square-check' : 'i-lucide-square'}`"
									variant="ghost"
									size="md"
									@click="toggleCompleted(task.id)"
								/>
								<div>
									<div
										:class="`text-highlighted font-medium ${task.completed == true ? 'line-through' : ''}`">
										{{ task.title }}
									</div>
									<div
										:class="`text-muted font-light text-sm ${task.completed == true ? 'line-through' : ''}`">
										{{ task.description }}
									</div>
								</div>
								<UButton icon="i-lucide-trash-2" variant="ghost" size="sm" class="ml-auto" @click="deleteTask(task.id)"/>
							</div>
						</div>
					</UPageCard>
				</UPageList>
			</div>
		</div>
	</div>
</template>
