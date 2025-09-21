<template>
  <div class="progress-bar-container">
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: `${progressPercentage}%` }"
        :aria-valuenow="progressPercentage"
        :aria-valuemin="0"
        :aria-valuemax="100"
        role="progressbar"
        :aria-label="progressLabel"
      ></div>
    </div>
    <div v-if="showLabel" class="progress-label">
      {{ progressLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  total: number
  showLabel?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  current: 0,
  total: 100,
  showLabel: true,
  label: '',
})

// Computed properties
const progressPercentage = computed((): number => {
  if (props.total === 0) return 0
  return Math.min(100, Math.max(0, (props.current / props.total) * 100))
})

const progressLabel = computed((): string => {
  if (props.label) {
    return props.label
  }
  return `${props.current} / ${props.total} (${Math.round(progressPercentage.value)}%)`
})
</script>

<style scoped>
.progress-bar-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: var(--bg-input);
  border-radius: var(--radius-sm);
  overflow: hidden;
  border: 1px solid var(--border-color-light);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-gradient-start), var(--primary-gradient-end));
  border-radius: var(--radius-sm);
  transition: width 0.3s ease-in-out;
  min-width: 0;
}

.progress-label {
  font-size: var(--font-size-sm);
  color: var(--text-color-secondary);
  text-align: center;
  font-weight: var(--font-weight-medium);
}

/* Responsive design */

/* Animation for progress changes */
.progress-fill {
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
