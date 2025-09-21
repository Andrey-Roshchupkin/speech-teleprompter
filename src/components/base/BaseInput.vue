<template>
  <div class="form-group">
    <label v-if="label" :for="id" :class="labelClasses" :aria-describedby="ariaDescribedby">
      {{ label }}
      <span v-if="required" class="required-indicator" aria-label="required">*</span>
    </label>

    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :min="min"
      :max="max"
      :step="step"
      :class="inputClasses"
      :aria-label="props['aria-label']"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="hasError"
      :aria-required="required"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
      @keydown="handleKeydown"
    />

    <div
      v-if="errorMessage"
      :id="`${id}-error`"
      class="error-message"
      role="alert"
      :aria-live="props['aria-live']"
    >
      {{ errorMessage }}
    </div>

    <div v-if="helpText && !errorMessage" :id="`${id}-help`" class="help-text">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InputProps } from '@/types/global'

// ============================================================================
// Props Definition
// ============================================================================

interface Props extends Partial<InputProps> {
  id?: string
  label?: string
  helpText?: string
  errorMessage?: string
  class?: string
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-live'?: 'off' | 'polite' | 'assertive'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  value: '',
  placeholder: undefined,
  disabled: false,
  required: false,
  min: undefined,
  max: undefined,
  step: undefined,
  id: undefined,
  label: undefined,
  helpText: undefined,
  errorMessage: undefined,
  class: undefined,
  'aria-label': undefined,
  'aria-describedby': undefined,
  'aria-live': 'polite',
})

// ============================================================================
// Emits Definition
// ============================================================================

interface Emits {
  'update:modelValue': [value: string | number]
  input: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
}

const emit = defineEmits<Emits>()

// ============================================================================
// Computed Properties
// ============================================================================

const modelValue = computed((): string | number => {
  return props.value
})

const hasError = computed((): boolean => {
  return !!props.errorMessage
})

const labelClasses = computed((): string => {
  const classes = ['form-label']

  if (hasError.value) {
    classes.push('form-label--error')
  }

  if (props.disabled) {
    classes.push('form-label--disabled')
  }

  return classes.join(' ')
})

const inputClasses = computed((): string => {
  const classes = ['form-input']

  if (hasError.value) {
    classes.push('form-input--error')
  }

  if (props.disabled) {
    classes.push('form-input--disabled')
  }

  if (props.class) {
    classes.push(props.class)
  }

  return classes.join(' ')
})

const ariaDescribedby = computed((): string | undefined => {
  const ids: string[] = []

  if (props['aria-describedby']) {
    ids.push(props['aria-describedby'])
  }

  if (props.helpText && !hasError.value) {
    ids.push(`${props.id}-help`)
  }

  if (hasError.value) {
    ids.push(`${props.id}-error`)
  }

  return ids.length > 0 ? ids.join(' ') : undefined
})

// ============================================================================
// Event Handlers
// ============================================================================

const handleInput = (event: Event): void => {
  const target = event.target as HTMLInputElement
  let value: string | number = target.value

  // Convert to number for number inputs
  if (props.type === 'number' && value !== '') {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      value = numValue
    } else {
      // Keep the string value for invalid numbers
      value = target.value
    }
  }

  emit('update:modelValue', value)
  emit('input', event)
}

const handleBlur = (event: FocusEvent): void => {
  emit('blur', event)
}

const handleFocus = (event: FocusEvent): void => {
  emit('focus', event)
}

const handleKeydown = (event: KeyboardEvent): void => {
  emit('keydown', event)
}
</script>

<style scoped>
.form-group {
  margin-bottom: var(--spacing-md);
}

.form-label {
  display: block;
  font-weight: var(--font-weight-semibold);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
  transition: color var(--transition-normal) ease;
}

.form-label--error {
  color: var(--danger-color);
}

.form-label--disabled {
  color: var(--text-muted);
}

.required-indicator {
  color: var(--danger-color);
  margin-left: var(--spacing-xs);
}

.form-input {
  width: 100%;
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
  font-family: inherit;
  border: 2px solid var(--input-border);
  border-radius: var(--radius-md);
  background-color: var(--input-bg);
  color: var(--input-text);
  transition:
    border-color var(--transition-normal) ease,
    box-shadow var(--transition-normal) ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--input-border-focus);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-input--error {
  border-color: var(--border-error);
}

.form-input--error:focus {
  border-color: var(--border-error);
  box-shadow: 0 0 0 3px var(--danger-bg);
}

.form-input--disabled {
  background-color: var(--bg-tertiary);
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.6;
  border-color: var(--bg-tertiary);
}

.form-input--disabled:focus {
  border-color: var(--bg-tertiary);
  box-shadow: none;
}

.error-message {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--danger-color);
  font-weight: var(--font-weight-medium);
}

.help-text {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  line-height: var(--line-height-normal);
}

/* High contrast mode support */
/* Media queries removed for now as mobile version is not implemented */
</style>
