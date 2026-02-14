<script lang="ts">
/**
 * UFocusEditable
 *
 * A component inspired by Reka UI's Editable, but generalized:
 * instead of swapping between a preview text and an input,
 * it swaps between a "default" (preview) slot and an "editing" slot.
 *
 * - Click (or dblclick, depending on `activationMode`) to enter edit mode.
 * - Press Enter to submit (emits `submit`).
 * - Press Escape to cancel (emits `cancel`).
 * - Clicking outside / blurring out submits or cancels based on `submitMode`.
 * - All events (`submit`, `cancel`, `edit`) are cancellable via `.preventDefault()`.
 */

export type ActivationMode = 'click' | 'dblclick'
export type SubmitMode = 'blur' | 'enter' | 'none' | 'both'

export interface FocusEditableEvent {
	/** Call to prevent the default behavior (entering/exiting edit mode). */
	preventDefault: () => void
	/** Whether `preventDefault()` was called. */
	defaultPrevented: boolean
}

export interface UFocusEditableProps {
	/**
	 * Whether the component is disabled (never enters edit mode).
	 * @defaultValue false
	 */
	disabled?: boolean

	/**
	 * How clicking on the preview activates edit mode.
	 * @defaultValue 'click'
	 */
	activationMode?: ActivationMode

	/**
	 * What happens when focus leaves the editing area.
	 * - `'blur'`  — calls submit on blur
	 * - `'enter'` — only Enter key submits; blur cancels
	 * - `'both'`  — Enter submits AND blur submits
	 * - `'none'`  — blur cancels; only explicit submit/cancel
	 * @defaultValue 'blur'
	 */
	submitMode?: SubmitMode

	/**
	 * Start in edit mode immediately.
	 * @defaultValue false
	 */
	startWithEditMode?: boolean

	/**
	 * The element or component this component should render as.
	 * @defaultValue 'div'
	 */
	as?: string | Component
}

export interface UFocusEditableEmits {
	/** Fired when entering edit mode. The event is cancellable. */
	(e: 'edit', event: FocusEditableEvent): void
	/** Fired when submitting (confirming) from edit mode. The event is cancellable. */
	(e: 'submit', event: FocusEditableEvent): void
	/** Fired when cancelling edit mode. The event is cancellable. */
	(e: 'cancel', event: FocusEditableEvent): void
	/** Fired whenever the editing state changes. */
	(e: 'update:editing', value: boolean): void
}

export interface UFocusEditableSlots {
	/** Shown when NOT editing. Receives `{ edit }` to programmatically enter edit mode. */
	default(props: {
		edit: () => void
		isEditing: false
	}): any
	/** Shown when editing. Receives `{ submit, cancel }` to programmatically control the state. */
	editing(props: {
		submit: () => void
		cancel: () => void
		isEditing: true
	}): any
}
</script>

<script setup lang="ts">
import {
	ref,
	watch,
	onMounted,
	onBeforeUnmount,
	nextTick,
	type Component,
} from 'vue'

const props = withDefaults(defineProps<UFocusEditableProps>(), {
	disabled: false,
	activationMode: 'click',
	submitMode: 'blur',
	startWithEditMode: false,
	as: 'div',
})

const emit = defineEmits<UFocusEditableEmits>()
defineSlots<UFocusEditableSlots>()

// State
const isEditing = ref(props.startWithEditMode)
const rootRef = ref<HTMLElement | null>(null)

/**
 * Guard flag: set to `true` immediately when submit() or cancel() begins,
 * so that no other code path (focusout, pointerdown, keydown) can trigger
 * a second transition during the same "exit".
 */
let isTransitioning = false

// Cancellable event helper
function createEvent(): FocusEditableEvent {
	let prevented = false
	return {
		preventDefault() {
			prevented = true
		},
		get defaultPrevented() {
			return prevented
		},
	}
}

// Public API
function edit() {
	if (props.disabled || isEditing.value) return

	const ev = createEvent()
	emit('edit', ev)
	if (ev.defaultPrevented) return

	isEditing.value = true
	emit('update:editing', true)

	nextTick(() => {
		focusFirstFocusable()
	})
}

function submit() {
	if (!isEditing.value || isTransitioning) return
	isTransitioning = true

	const ev = createEvent()
	emit('submit', ev)
	if (ev.defaultPrevented) {
		isTransitioning = false
		return
	}

	isEditing.value = false
	emit('update:editing', false)

	// Reset guard after the DOM has settled
	nextTick(() => {
		isTransitioning = false
	})
}

function cancel() {
	if (!isEditing.value || isTransitioning) return
	isTransitioning = true

	const ev = createEvent()
	emit('cancel', ev)
	if (ev.defaultPrevented) {
		isTransitioning = false
		return
	}

	isEditing.value = false
	emit('update:editing', false)

	nextTick(() => {
		isTransitioning = false
	})
}

// Focus management
const focusableSelectors = [
	'input:not([disabled]):not([tabindex="-1"])',
	'textarea:not([disabled]):not([tabindex="-1"])',
	'select:not([disabled]):not([tabindex="-1"])',
	'[contenteditable="true"]',
	'button:not([disabled]):not([tabindex="-1"])',
	'[tabindex]:not([tabindex="-1"])',
	'a[href]',
].join(', ')

function focusFirstFocusable() {
	const root = rootRef.value
	if (!root) return
	const el = root.querySelector<HTMLElement>(focusableSelectors)
	el?.focus()
}

// Activation handler
function handleClick(event: MouseEvent) {
	// Only activate from default slot clicks, never from editing slot
	if (isEditing.value) return
	if (props.activationMode === 'click') {
		edit()
	}
}

function handleDblClick(event: MouseEvent) {
	if (isEditing.value) return
	if (props.activationMode === 'dblclick') {
		edit()
	}
}

// Keyboard handler (on root, captures from children)
function handleKeydown(event: KeyboardEvent) {
	if (!isEditing.value || isTransitioning) return

	if (event.key === 'Escape') {
		event.preventDefault()
		event.stopPropagation()
		cancel()
		return
	}

	if (event.key === 'Enter' && !event.shiftKey) {
		if (props.submitMode === 'enter' || props.submitMode === 'both') {
			const target = event.target as HTMLElement
			const isMultiline =
				target.tagName === 'TEXTAREA' ||
				target.getAttribute('contenteditable') === 'true'

			if (!isMultiline) {
				event.preventDefault()
				event.stopPropagation()
			}
			submit()
		}
	}
}

// Focusout dismiss
function handleFocusOut(event: FocusEvent) {
	if (!isEditing.value || isTransitioning) return

	const root = rootRef.value
	if (!root) return

	// relatedTarget is the element receiving focus.
	// If it's still inside our root, it's an internal focus move — ignore.
	const relatedTarget = event.relatedTarget as Node | null
	if (relatedTarget && root.contains(relatedTarget)) return

	// Wait a tick: the DOM needs to settle (e.g., a click on a submit button
	// inside the editing slot will fire focusout before the button's click).
	nextTick(() => {
		if (!isEditing.value || isTransitioning) return

		// Re-check: activeElement may now be inside our root
		// (e.g., focus moved to another child inside the slot)
		if (root.contains(document.activeElement)) return

		if (props.submitMode === 'blur' || props.submitMode === 'both') {
			submit()
		} else {
			cancel()
		}
	})
}

// Global pointerdown for outside-click detection
function handlePointerDownOutside(event: PointerEvent) {
	if (!isEditing.value || isTransitioning) return

	const root = rootRef.value
	if (!root) return
	if (root.contains(event.target as Node)) return

	// The pointerdown is outside — dismiss.
	// We let the focusout handler do the actual work if both fire,
	// but guard with isTransitioning to prevent doubles.
	if (props.submitMode === 'blur' || props.submitMode === 'both') {
		submit()
	} else {
		cancel()
	}
}

watch(isEditing, (editing) => {
	if (editing) {
		document.addEventListener('pointerdown', handlePointerDownOutside, true)
	} else {
		document.removeEventListener('pointerdown', handlePointerDownOutside, true)
	}
})

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', handlePointerDownOutside, true)
})

onMounted(() => {
	if (props.startWithEditMode) {
		nextTick(() => focusFirstFocusable())
	}
})

// Expose for template refs
defineExpose({ edit, submit, cancel, isEditing })
</script>

<template>
	<component
		:is="as"
		ref="rootRef"
		:data-editing="isEditing ? '' : undefined"
		:data-disabled="disabled ? '' : undefined"
		@click="handleClick"
		@dblclick="handleDblClick"
		@focusout="handleFocusOut"
		@keydown="handleKeydown"
	>
		<slot
			v-if="!isEditing"
			:edit="edit"
			:is-editing="(false as const)"
		/>

		<slot
			v-else
			name="editing"
			:submit="submit"
			:cancel="cancel"
			:is-editing="(true as const)"
		/>
	</component>
</template>
