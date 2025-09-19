<template>
  <div class="speech-output-container">
    <div class="speech-output-header">
      <h3>🎤 Speech Output</h3>
    </div>

    <div class="speech-output-content">
      <div class="speech-output-display">
        <div v-if="!isListening && !hasOutput" class="speech-placeholder">
          Click "Start" to begin speech recognition...
        </div>

        <div v-else class="speech-content">
          <div v-if="finalTranscript" class="final-transcript">
            <strong>Final:</strong> {{ finalTranscript }}
          </div>

          <div v-if="interimTranscript" class="interim-transcript">
            <strong>Interim:</strong> {{ interimTranscript }}
          </div>

          <div v-if="isListening" class="listening-indicator">
            <span class="listening-dot"></span>
            Listening...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  finalTranscript: string
  interimTranscript: string
  isListening: boolean
}

const props = withDefaults(defineProps<Props>(), {
  finalTranscript: '',
  interimTranscript: '',
  isListening: false,
})

// Computed properties
const hasOutput = computed((): boolean => {
  return props.finalTranscript.length > 0 || props.interimTranscript.length > 0
})
</script>

<style scoped>
.speech-output-container {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.speech-output-header {
  margin-bottom: var(--spacing-lg);
}

.speech-output-header h3 {
  color: var(--text-color-primary);
  font-size: var(--font-size-xl);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.speech-output-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.speech-output-display {
  min-height: 100px;
  padding: var(--spacing-md);
  background-color: var(--bg-input);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  font-family: var(--font-family-monospace);
}

.speech-placeholder {
  color: var(--text-color-secondary);
  font-style: italic;
  text-align: center;
  padding: var(--spacing-lg);
}

.speech-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.final-transcript {
  color: var(--text-color-primary);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-md);
}

.interim-transcript {
  color: var(--text-color-secondary);
  font-style: italic;
  line-height: var(--line-height-md);
}

.listening-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
  margin-top: var(--spacing-sm);
}

.listening-dot {
  width: 8px;
  height: 8px;
  background-color: var(--color-success);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsive design */
</style>
