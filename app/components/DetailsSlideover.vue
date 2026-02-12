<script setup lang="ts">
import * as z from 'zod'
import type { CalendarDate } from '@internationalized/date'
import type { FormSubmitEvent } from '#ui/types'

const props = defineProps<{
  titleRef: string
  descriptionRef?: string | undefined
  dateRef: CalendarDate
}>()

const state = shallowReactive({
  title: props.titleRef,
  description: props.descriptionRef,
  date: props.dateRef
})

const schema = z.object({
  title: z.string('Title is required').min(1, 'Must be at least 1 character'),
  description: z.string().optional(),
  date: z.custom<CalendarDate>() })

type Schema = z.output<typeof schema>

const emit = defineEmits<{
  close: [boolean]
  update: [payload: Schema]
}>()

const toast = useToast()

const inputDate = useTemplateRef('inputDate')

async function onSubmit(event: FormSubmitEvent<Schema>) {
  toast.add({
    title: 'Success',
    description: 'Task updated successfully!',
    icon: 'i-lucide-circle-check',
    color: 'success'
  })
  emit('close', true)
  emit('update', event.data)
  console.log(event.data)
}
</script>

<template>
  <USlideover
    title="Edit Task"
    description="Edit details to thy heart's content. "
  >
    <template #body>
      <div>
        <UForm
          :schema="schema"
          :state="state"
          @submit="onSubmit"
        >
          <UFormField
            label="Title"
            name="title"
            class="mb-2"
          >
            <UInput v-model="state.title" />
          </UFormField>
          <UFormField
            label="Description"
            name="description"
            class="my-2"
          >
            <UInput v-model="state.description" />
          </UFormField>
          <UFormField
            label="Date"
            name="date"
            class="my-2"
          >
            <UInputDate
              v-model="state.date"
              ref="inputDate"
            >
              <template #trailing>
                <UPopover :reference="inputDate?.inputsRef[3]?.$el">
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-lucide-calendar"
                    aria-label="Select a date"
                    class="px-0"
                  />

                  <template #content>
                    <UCalendar v-model="state.date" class="p-2" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>
          <Span>
            <UButton
              label="Close"
              class="my-2"
              variant="ghost"
              color="neutral"
              @click="emit('close', false)"
            />
          </Span>
          <Span class="mx-2">
            <UButton
              type="submit"
              variant="ghost"
              label="Save Changes & Exit"
              class="my-2"
            />
          </Span>
        </UForm>
      </div>
    </template>
  </USlideover>
</template>

<style scoped>

</style>
