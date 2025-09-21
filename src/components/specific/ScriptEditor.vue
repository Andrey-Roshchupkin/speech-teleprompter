<template>
  <div class="script-editor-container">
    <div class="script-editor-header">
      <h3>📝 Script Text</h3>
    </div>

    <div class="script-editor-content">
      <BaseTextarea
        id="script-text"
        v-model="localScriptText"
        placeholder="Enter your teleprompter script here..."
        :rows="8"
        @update:model-value="handleScriptChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'

interface Props {
  scriptText: string
}

const props = withDefaults(defineProps<Props>(), {
  scriptText:
    'Welcome to our presentation. Today we will be discussing the future of technology and how it impacts our daily lives. Let me start by sharing some interesting statistics about digital transformation in various industries.',
})

const emit = defineEmits<{
  (e: 'update:scriptText', value: string): void
}>()

// Local state
const localScriptText = ref(props.scriptText)

// Methods
const handleScriptChange = (value: string): void => {
  localScriptText.value = value
  emit('update:scriptText', value)
}

// Watch for prop changes
watch(
  () => props.scriptText,
  (newValue) => {
    localScriptText.value = newValue
  },
)
</script>

<style scoped>
.script-editor-container {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.script-editor-header {
  margin-bottom: var(--spacing-lg);
}

.script-editor-header h3 {
  color: var(--text-color-primary);
  font-size: var(--font-size-xl);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.script-editor-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* Responsive design */
</style>
