<template>
  <div class="debug-log-container">
    <div class="debug-log-header">
      <h3>🐛 Debug Log</h3>
    </div>

    <div class="debug-log-content">
      <!-- Log Level Controls -->
      <div class="log-level-controls">
        <div class="setting-column">
          <label>Log Level</label>
          <div class="radio-group">
            <label class="radio-option">
              <input
                type="radio"
                name="logLevel"
                value="off"
                :checked="localLogLevel === 'off'"
                @change="handleLogLevelChange('off')"
              />
              <span>Off</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="logLevel"
                value="error"
                :checked="localLogLevel === 'error'"
                @change="handleLogLevelChange('error')"
              />
              <span>Error</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="logLevel"
                value="info"
                :checked="localLogLevel === 'info'"
                @change="handleLogLevelChange('info')"
              />
              <span>Info</span>
            </label>
            <label class="radio-option">
              <input
                type="radio"
                name="logLevel"
                value="debug"
                :checked="localLogLevel === 'debug'"
                @change="handleLogLevelChange('debug')"
              />
              <span>Debug</span>
            </label>
          </div>
        </div>
      </div>

      <div class="debug-info">
        <p>
          Logs are displayed in the browser's developer console.<br />
          Open DevTools and view logs in the Console tab.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { type LogLevel } from '@/types/global'

interface Props {
  logLevel: LogLevel
}

const props = withDefaults(defineProps<Props>(), {
  logLevel: 'info',
})

const emit = defineEmits<{
  (e: 'update:logLevel', value: LogLevel): void
}>()

// Local state
const localLogLevel = ref(props.logLevel)

// Methods
const handleLogLevelChange = (level: LogLevel): void => {
  localLogLevel.value = level
  emit('update:logLevel', level)
}

// Watch for prop changes
watch(
  () => props.logLevel,
  (newValue) => {
    localLogLevel.value = newValue
  },
)
</script>

<style scoped>
.debug-log-container {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.debug-log-header {
  margin-bottom: var(--spacing-lg);
}

.debug-log-header h3 {
  color: var(--text-color-primary);
  font-size: var(--font-size-xl);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.debug-log-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.log-level-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setting-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-column label {
  font-weight: var(--font-weight-medium);
  color: var(--text-color-primary);
  font-size: var(--font-size-md);
  margin-bottom: var(--spacing-xs);
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-color-primary);
}

.radio-option input[type='radio'] {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
}

.radio-option span {
  user-select: none;
}

.debug-info {
  background-color: var(--bg-input);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.debug-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-md);
}

/* Responsive design */
</style>
