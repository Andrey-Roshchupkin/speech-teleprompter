<template>
  <div :class="['form-group', { 'form-group--error': hasError }, props.class]">
    <label v-if="label" :for="id" :class="labelClasses">
      {{ label }}
      <span v-if="required" class="required-indicator" aria-hidden="true"
        >*</span
      >
    </label>
    <textarea
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :cols="cols"
      :class="textareaClasses"
      :aria-label="props['aria-label']"
      :aria-describedby="ariaDescribedby"
      :aria-invalid="hasError"
      :aria-required="required"
      @input="handleInput"
      @blur="emit('blur', $event)"
      @focus="emit('focus', $event)"
      @keydown="emit('keydown', $event)"
    ></textarea>
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
import { computed } from 'vue';
import { type TextareaSize } from '@/types/global';

interface Props {
  id: string;
  modelValue: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  size?: TextareaSize;
  rows?: number;
  cols?: number;
  class?: string;
  'aria-label'?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  disabled: false,
  size: 'medium',
  rows: 4,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'input', event: Event): void;
  (e: 'blur', event: FocusEvent): void;
  (e: 'focus', event: FocusEvent): void;
  (e: 'keydown', event: KeyboardEvent): void;
}>();

// Computed properties
const hasError = computed((): boolean => Boolean(props.errorMessage));

const labelClasses = computed((): string => {
  const base = 'form-label';
  const size = `form-label--${props.size}`;
  const required = props.required ? 'form-label--required' : '';
  return [base, size, required].filter(Boolean).join(' ');
});

const textareaClasses = computed((): string => {
  const base = 'form-textarea';
  const size = `form-textarea--${props.size}`;
  const error = hasError.value ? 'form-textarea--error' : '';
  const disabled = props.disabled ? 'form-textarea--disabled' : '';
  return [base, size, error, disabled].filter(Boolean).join(' ');
});

const ariaDescribedby = computed((): string => {
  const ids: string[] = [];
  if (props.helpText && !hasError.value) {
    ids.push(`${props.id}-help`);
  }
  if (props.errorMessage) {
    ids.push(`${props.id}-error`);
  }
  return ids.join(' ');
});

// Event handlers
const handleInput = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
  emit('input', event);
};
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

.form-textarea {
  width: 100%;
  padding: 15.75rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 1rem;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 6rem;
  transition: all 0.2s ease;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.form-textarea--small {
  padding: 15.5rem 0.75rem;
  font-size: 0.875rem;
  min-height: 4rem;
}

.form-textarea--medium {
  padding: 15.75rem;
  font-size: 1rem;
  min-height: 6rem;
}

.form-textarea--large {
  padding: 1rem;
  font-size: 1.125rem;
  min-height: 8rem;
}

.form-textarea--error {
  border-color: var(--danger-color);
}

.form-textarea--error:focus {
  border-color: var(--danger-color);
  box-shadow: 0 0 0 3px var(--danger-light);
}

.form-textarea--disabled {
  background-color: var(--bg-disabled);
  color: var(--text-disabled);
  cursor: not-allowed;
  opacity: 0.6;
  resize: none;
}

.form-textarea--disabled:focus {
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

/* Dark mode support */
</style>
