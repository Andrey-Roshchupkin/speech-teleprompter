<template>
  <div :class="['form-group', { 'form-group--error': hasError }, props.class]">
    <label v-if="label" :for="id" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="required-indicator" aria-hidden="true">*</span>
    </label>
    <select
      :id="id"
      :value="modelValue"
      :disabled="disabled"
      :required="required"
      :class="selectClasses"
      :aria-label="props['aria-label']"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="hasError"
      :aria-required="required"
      @change="handleChange"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      @keydown="emit('keydown', $event)"
    >
      <option v-if="placeholder" value="" disabled>
        {{ placeholder }}
      </option>
      <option
        v-for="option in options"
        :key="option.code"
        :value="option.code"
        :disabled="option.disabled"
      >
        {{ option.name }}
      </option>
    </select>
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
import { type SelectSize, type LanguageOption } from '@/types/global'

interface SelectOption extends LanguageOption {
  disabled?: boolean
}

interface Props {
  id: string
  modelValue: string
  label?: string
  placeholder?: string
  helpText?: string
  errorMessage?: string
  required?: boolean
  disabled?: boolean
  size?: SelectSize
  options: SelectOption[]
  class?: string
  'aria-label'?: string
  'aria-live'?: 'off' | 'polite' | 'assertive'
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  size: 'medium',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'change', event: Event): void
  (e: 'blur', event: FocusEvent): void
  (e: 'focus', event: FocusEvent): void
  (e: 'keydown', event: KeyboardEvent): void
}>()

// Computed properties
const hasError = computed((): boolean => Boolean(props.errorMessage))

const labelClasses = computed((): string => {
  const base = 'form-label'
  const size = `form-label--${props.size}`
  const required = props.required ? 'form-label--required' : ''
  return [base, size, required].filter(Boolean).join(' ')
})

const selectClasses = computed((): string => {
  const base = 'form-select'
  const size = `form-select--${props.size}`
  const error = hasError.value ? 'form-select--error' : ''
  const disabled = props.disabled ? 'form-select--disabled' : ''
  return [base, size, error, disabled].filter(Boolean).join(' ')
})

const ariaDescribedby = computed((): string => {
  const ids: string[] = []
  if (props.helpText && !hasError.value) {
    ids.push(`${props.id}-help`)
  }
  if (props.errorMessage) {
    ids.push(`${props.id}-error`)
  }
  return ids.join(' ')
})

// Event handlers
const handleChange = (event: Event): void => {
  const target = event.target as HTMLSelectElement
  emit('update:modelValue', target.value)
  emit('change', event)
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

.form-group--error {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
  transition: color 0.2s ease;
}

.form-label--small {
  font-size: 0.875rem;
}

.form-label--medium {
  font-size: 1rem;
}

.form-label--large {
  font-size: 1.125rem;
}

.form-label--required {
  position: relative;
}

.required-indicator {
  color: var(--danger-color);
  margin-left: 0.25rem;
}

.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.form-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-select--small {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.form-select--medium {
  padding: 0.75rem;
  font-size: 1rem;
}

.form-select--large {
  padding: 1rem;
  font-size: 1.125rem;
}

.form-select--error {
  border-color: var(--danger-color);
}

.form-select--error:focus {
  border-color: var(--danger-color);
  box-shadow: 0 0 0 3px var(--danger-light);
}

.form-select--disabled {
  background-color: var(--bg-disabled);
  color: var(--text-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.form-select--disabled:focus {
  border-color: var(--border-color);
  box-shadow: none;
}

.help-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.error-message {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--danger-color);
  font-weight: 500;
}

/* Media queries removed for now as mobile version is not implemented */
</style>
