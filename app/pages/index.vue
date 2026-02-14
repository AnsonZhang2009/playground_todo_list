<script setup lang="ts">
import {defineShortcuts} from '#ui/composables/index.js'
import {today, getLocalTimeZone, type CalendarDate} from '@internationalized/date'
import {DetailsSlideover} from '#components'
import {useTasksStore} from "~/composables/stores/useTasksStore";
import type {Task, NewTask} from '#shared/types/db';

const value = shallowRef<CalendarDate>(today(getLocalTimeZone()))
const open = ref(false)

const overlay = useOverlay()
const detailsSlideover = overlay.create(DetailsSlideover)
const tempTodo = ref<Task>({
	id: -1,
	title: 'Untitled',
	description: 'Undesc',
	completed: false,
	dueDate: null
})

defineShortcuts({
	o: () => {
		open.value = !open.value
	}
})

const {
	tasks,
	loading,
	error,
	fetchAll,
	fetchOne,
	update,
	toggle,
	create,
	remove
} = useTasksStore()

onMounted(async () => {
	await fetchAll()
})

function openSlideover(index: number) {
	console.log(index)
	const task = unref(tasks)[index - 1]
	if (!task) return;
	detailsSlideover.open({
		title: task.title,
		description: task.description,
		dueDate: task.dueDate ? new Date(task.dueDate) : null,
		async onUpdate(payload) {
			await update(index, {
				...payload,
				dueDate: payload.dueDate ? payload.dueDate.toDate(getLocalTimeZone()) : null
			})
		}
	})
}

function addNewTask() {
	const newTask: NewTask = {
		title: 'Enter a task',
		description: 'Enter a description',
		completed: false,
		dueDate: getTodayDate().toDate(getLocalTimeZone())
	}
	detailsSlideover.open({
		title: newTask.title,
		description: newTask.description || null,
		dueDate: newTask.dueDate || null,
		async onUpdate(payload) {
			await create({
				...payload,
				dueDate: payload.dueDate.toDate(getLocalTimeZone())
			})
		}
	})
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
						<span>
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
						</span>
						<span>{{ value.toString() }}</span>
					</div>
				</template>
			</UPageCard>
			<div class="my-2">
				<UPageList>
					<UPageCard
						v-for="task in tasks"
						:key="task.id"
						variant="ghost"
						:class="`my-1 select-none transition ${task.completed === true ? 'line-through opacity-50' : 'hover:scale-[1.01] hover:bg-elevated/50 opacity-100'}`"

					>
						<div :class="`flex gap-2 w-full items-center`" @dblclick="openSlideover(task.id)">
							<UButton
								:icon="`${task.completed == true ? 'i-lucide-square-check' : 'i-lucide-square'}`"
								variant="ghost"
								size="md"
								@click="toggle(task.id)"
							/>
							<div class="flex flex-col items-start justify-center w-full">
								<UFocusEditable
									submit-mode="both"
									@edit="() => tempTodo = { ...task }"
									@submit="() => update(tempTodo.id, tempTodo)"
									class="w-full"
									:disabled="task.completed"
								>
									<div :class="`text-highlighted font-medium ${task.completed == true ? 'line-through' : ''}`">
										{{ task.title }}
									</div>
									<template #editing="{ submit, cancel }">
										<UInput
											v-model="tempTodo.title"
											@keydown.enter="submit"
											@keydown.escape="cancel"
											class="w-full"
										/>
									</template>
								</UFocusEditable>

								<UFocusEditable
									submit-mode="both"
									@edit="() => tempTodo = { ...task }"
									@submit="() => update(tempTodo.id, tempTodo)"
									class="w-full"
									:disabled="task.completed"
								>
									<div :class="`text-muted font-light text-sm ${task.completed == true ? 'line-through' : ''}`">
										{{ task.description }}
									</div>
									<template #editing="{ submit, cancel }">
										<UTextarea
											v-model="tempTodo.description"
											@keydown.enter="submit"
											@keydown.escape="cancel"
											class="w-full"
										/>
									</template>
								</UFocusEditable>
							</div>
							<UButton @click="remove(task.id)" icon="i-lucide-trash-2" color="error" variant="ghost" size="md" class="ml-auto"/>
						</div>
					</UPageCard>
				</UPageList>
			</div>
		</div>
	</div>
</template>
