<template>
  <button
    :id="props.id"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :aria-label="props['aria-label']"
    :aria-describedby="props['aria-describedby']"
    :aria-live="props['aria-live']"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <span v-if="loading" class="btn__loading" aria-hidden="true">
      <svg class="btn__spinner" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" fill="none" />
      </svg>
    </span>
    <span v-if="icon && !loading" class="btn__icon" aria-hidden="true">
      {{ icon }}
    </span>
    <span class="btn__content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps } from '@/types/global'

// ============================================================================
// Props Definition
// ============================================================================

interface Props extends Partial<ButtonProps> {
  id?: string
  class?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-live'?: 'off' | 'polite' | 'assertive'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  disabled: false,
  loading: false,
  icon: undefined,
  id: undefined,
  class: undefined,
  'aria-label': undefined,
  'aria-describedby': undefined,
  'aria-live': 'off',
})

// ============================================================================
// Emits Definition
// ============================================================================

interface Emits {
  click: [event: MouseEvent]
  keydown: [event: KeyboardEvent]
}

const emit = defineEmits<Emits>()

// ============================================================================
// Computed Properties
// ============================================================================

const buttonClasses = computed((): string => {
  const classes = ['btn']

  // Variant classes
  classes.push(`btn--${props.variant}`)

  // Size classes
  classes.push(`btn--${props.size}`)

  // State classes
  if (props.loading) {
    classes.push('btn--loading')
  }

  if (props.disabled) {
    classes.push('btn--disabled')
  }

  // Custom class
  if (props.class) {
    classes.push(props.class)
  }

  return classes.join(' ')
})

// ============================================================================
// Event Handlers
// ============================================================================

const handleClick = (event: MouseEvent): void => {
  if (props.disabled || props.loading) {
    event.preventDefault()
    return
  }

  emit('click', event)
}

const handleKeydown = (event: KeyboardEvent): void => {
  // Handle Enter and Space key activation
  if (event.key === 'Enter' || event.key === ' ') {
    if (props.disabled || props.loading) {
      event.preventDefault()
      return
    }

    // For Enter key, let the default behavior handle it
    // For Space key, prevent default scrolling and trigger click
    if (event.key === ' ') {
      event.preventDefault()
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
      ;(event.target as HTMLButtonElement).dispatchEvent(clickEvent)
    }
  }

  emit('keydown', event)
}
</script>

<style scoped>
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  text-decoration: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal) ease;
  min-width: 100px;
  overflow: hidden;
}

.btn:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.btn:disabled,
.btn--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Variant Styles */
.btn--primary {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}

.btn--primary:hover:not(:disabled):not(.btn--disabled) {
  background: var(--button-primary-hover);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--shadow-primary);
}

.btn--success {
  background: var(--button-success-bg);
  color: var(--button-success-text);
}

.btn--success:hover:not(:disabled):not(.btn--disabled) {
  background: var(--button-success-hover);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--shadow-success);
}

.btn--danger {
  background: var(--button-danger-bg);
  color: var(--button-danger-text);
}

.btn--danger:hover:not(:disabled):not(.btn--disabled) {
  background: var(--button-danger-hover);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--shadow-danger);
}

.btn--neutral {
  background: var(--button-neutral-bg);
  color: var(--button-neutral-text);
}

.btn--neutral:hover:not(:disabled):not(.btn--disabled) {
  background: var(--button-neutral-hover);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px var(--shadow-medium);
}

/* Size Styles */
.btn--small {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
  min-width: 80px;
}

.btn--large {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-lg);
  min-width: 120px;
}

/* Loading State */
.btn--loading {
  cursor: wait;
}

.btn__loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn__spinner {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2em;
}

.btn__content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* High contrast mode support */
/* Media queries removed for now as mobile version is not implemented */
</style>
