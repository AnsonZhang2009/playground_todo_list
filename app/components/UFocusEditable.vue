<script lang="ts">
/**
 * UFocusEditable
 *
 * A component inspired by Reka UI's Editable, but generalized:
 * instead of swapping between a preview text and an input,
 * it swaps between a "default" (preview) slot and an "editing" slot.
 *
 * - Click (or dblclick / focus, depending on `activationMode`) to enter edit mode.
 * - Press Enter to submit (emits `submit`).
 * - Press Escape to cancel (emits `cancel`).
 * - Clicking outside / blurring out submits or cancels based on `submitMode`.
 * - All events (`submit`, `cancel`, `edit`) are cancellable via `.preventDefault()`.
 */

export type ActivationMode = 'click' | 'dblclick' | 'focus'
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

// ─── State ────────────────────────────────────────────────────────
const isEditing = ref(props.startWithEditMode)
const rootRef = ref<HTMLElement | null>(null)

// ─── Cancellable event helper ─────────────────────────────────────
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

// ─── Public API ───────────────────────────────────────────────────
function edit() {
	if (props.disabled || isEditing.value) return

	const ev = createEvent()
	emit('edit', ev)
	if (ev.defaultPrevented) return

	isEditing.value = true
	emit('update:editing', true)

	// After switching to editing slot, focus the first focusable element inside
	nextTick(() => {
		focusFirstFocusable()
	})
}

function submit() {
	if (!isEditing.value) return

	const ev = createEvent()
	emit('submit', ev)
	if (ev.defaultPrevented) return

	isEditing.value = false
	emit('update:editing', false)
}

function cancel() {
	if (!isEditing.value) return

	const ev = createEvent()
	emit('cancel', ev)
	if (ev.defaultPrevented) return

	isEditing.value = false
	emit('update:editing', false)
}

// ─── Focus management ─────────────────────────────────────────────
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

// ─── Activation handler ──────────────────────────────────────────
function handleActivation(mode: 'click' | 'dblclick' | 'focus') {
	if (props.activationMode === mode) {
		edit()
	}
}

// ─── Keyboard handler ─────────────────────────────────────────────
function handleKeydown(event: KeyboardEvent) {
	if (!isEditing.value) return

	if (event.key === 'Escape') {
		event.preventDefault()
		event.stopPropagation()
		cancel()
		return
	}

	if (event.key === 'Enter' && !event.shiftKey) {
		if (props.submitMode === 'enter' || props.submitMode === 'both') {
			// Don't prevent default for textareas or contenteditable — allow
			// Enter to work normally there unless the user explicitly listens.
			const target = event.target as HTMLElement
			const isMultiline =
				target.tagName === 'TEXTAREA' ||
				target.getAttribute('contenteditable') === 'true'

			if (!isMultiline) {
				event.preventDefault()
			}
			submit()
		}
	}
}

// ─── Outside-click / blur dismiss ─────────────────────────────────
function handleFocusOut(event: FocusEvent) {
	if (!isEditing.value) return

	const root = rootRef.value
	if (!root) return

	// relatedTarget is the element receiving focus.
	// If it's still inside our root, it's not a "blur out".
	const relatedTarget = event.relatedTarget as Node | null
	if (relatedTarget && root.contains(relatedTarget)) return

	// Use a microtask to let click events settle first
	// (e.g., clicking a submit button inside the editing slot)
	requestAnimationFrame(() => {
		// Re-check: state may have changed during the frame
		if (!isEditing.value) return
		if (relatedTarget && root.contains(relatedTarget)) return

		if (props.submitMode === 'blur' || props.submitMode === 'both') {
			submit()
		} else {
			cancel()
		}
	})
}

function handlePointerDownOutside(event: PointerEvent) {
	if (!isEditing.value) return

	const root = rootRef.value
	if (!root) return
	if (root.contains(event.target as Node)) return

	if (props.submitMode === 'blur' || props.submitMode === 'both') {
		submit()
	} else {
		cancel()
	}
}

// ─── Global pointerdown listener for outside-click detection ──────
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

// If `startWithEditMode`, focus on mount
onMounted(() => {
	if (props.startWithEditMode) {
		nextTick(() => focusFirstFocusable())
	}
})

// ─── Expose for template refs ─────────────────────────────────────
defineExpose({ edit, submit, cancel, isEditing })
</script>

<template>
	<component
		:is="as"
		ref="rootRef"
		:data-editing="isEditing ? '' : undefined"
		:data-disabled="disabled ? '' : undefined"
		@click="handleActivation('click')"
		@dblclick="handleActivation('dblclick')"
		@focus.capture="handleActivation('focus')"
		@focusout="handleFocusOut"
		@keydown="handleKeydown"
	>
		<!--
		  Default slot: shown when NOT editing.
		  Provides `edit()` so consumers can trigger edit mode programmatically.
		-->
		<slot
			v-if="!isEditing"
			:edit="edit"
			:is-editing="(false as const)"
		/>

		<!--
		  Editing slot: shown when editing.
		  Provides `submit()` and `cancel()` for programmatic control.
		-->
		<slot
			v-else
			name="editing"
			:submit="submit"
			:cancel="cancel"
			:is-editing="(true as const)"
		/>
	</component>
</template>
