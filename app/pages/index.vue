<script setup lang="ts">
import { defineShortcuts } from '#ui/composables/index.js'
import { today, getLocalTimeZone } from '@internationalized/date'
import { DetailsSlideover } from '#components'

const value = shallowRef(today(getLocalTimeZone()))
const open = ref(false)

const overlay = useOverlay()
const detailsSlideover = overlay.create(DetailsSlideover)

defineShortcuts({
  o: () => { open.value = !open.value }
})

const tasks = ref([
  {
    taskName: 'Task 1',
    description: 'Carpe diem. ',
    completed: true,
    due: shallowRef(today(getLocalTimeZone()))
  },
  {
    taskName: 'Task 2',
    description: 'Dum spiro, spero. ',
    completed: false,
    due: shallowRef(today(getLocalTimeZone()))
  },
  {
    taskName: 'Task 3',
    description: 'Carpe diem. ',
    completed: true,
    due: shallowRef(today(getLocalTimeZone()))
  },
  {
    taskName: 'Task 4',
    description: 'Carpe diem. ',
    completed: true,
    due: shallowRef(today(getLocalTimeZone()))
  }
])

const toggleCompleted = (index) => {
  tasks.value[index].completed = !tasks.value[index].completed
}

function openSlideover(index) {
  const task = tasks.value[index]
  detailsSlideover.open({
    titleRef: unref(task.taskName),
    descriptionRef: unref(task.description),
    dateRef: unref(task.due),
    onUpdate(payload) {
      tasks.value[index].taskName = payload.title
      tasks.value[index].description = payload.description || desc.value || ''
      tasks.value[index].due = payload.date
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
                  <UCalendar v-model="value" />
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
            v-for="(task, index) in tasks"
            :key="index"
            variant="ghost"
            :class="`my-1 hover:scale-99 duration-100 ${task.completed == true ? '' : 'hover:backdrop-brightness-98'}`"
          >
            <div @dblclick="openSlideover(index)">
              <div :class="`flex gap-2 w-full items-center ${task.completed == true ? 'brightness-10' : ''}`">
                <UButton
                  :icon="`${task.completed == true ? 'i-lucide-square-check' : 'i-lucide-square'}`"
                  variant="ghost"
                  size="md"
                  @click="toggleCompleted(index)"
                />
                <div>
                  <div :class="`text-highlighted font-medium ${task.completed == true ? 'line-through' : ''}`">
                    {{ task.taskName }}
                  </div>
                  <div :class="`text-muted font-light text-sm ${task.completed == true ? 'line-through' : ''}`">
                    {{ task.description }}
                  </div>
                </div>
              </div>
            </div>
          </UPageCard>
        </UPageList>
      </div>
    </div>
  </div>
</template>
