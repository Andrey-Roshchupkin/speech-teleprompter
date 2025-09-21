<template>
  <div class="speech-controls-container">
    <div class="speech-controls-header">
      <h3>🎤 Speech Controls</h3>
      <div class="speech-status" :class="statusClasses">
        <span class="status-indicator"></span>
        <span class="status-text">{{ statusText }}</span>
      </div>
    </div>

    <div class="speech-controls-actions">
      <BaseButton
        id="toggle-button"
        :variant="isListening ? 'danger' : 'success'"
        size="large"
        :loading="isLoading"
        :disabled="!isSupported"
        @click="handleToggle"
        :aria-label="isListening ? 'Stop speech recognition' : 'Start speech recognition'"
      >
        <span v-if="isListening">🛑 Stop</span>
        <span v-else>🎤 Start</span>
      </BaseButton>

      <BaseButton
        id="reset-button"
        variant="neutral"
        size="medium"
        :disabled="isListening"
        @click="handleReset"
        aria-label="Reset speech recognition"
      >
        🔄 Reset
      </BaseButton>
    </div>

    <div v-if="!isSupported" class="speech-error">
      <p>⚠️ Speech recognition is not supported in this browser.</p>
      <p>Please use a modern browser like Chrome, Firefox, or Safari.</p>
    </div>

    <div v-if="errorMessage" class="speech-error">
      <p>❌ {{ errorMessage }}</p>
    </div>

    <div class="speech-info">
      <div class="info-item">
        <span class="info-label">Status:</span>
        <span class="info-value">{{ statusText }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Language:</span>
        <span class="info-value">{{ currentLanguage }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Words Matched:</span>
        <span class="info-value">{{ matchedWordsCount }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Progress:</span>
        <span class="info-value">{{ progressPercentage }}%</span>
      </div>
    </div>

    <!-- Speech Output Display -->
    <div class="speech-output-section">
      <h4>🎤 Speech Output</h4>
      <div class="speech-output" :class="outputClasses">
        <div v-if="finalTranscript" class="final-transcript">
          <strong>Final:</strong> {{ finalTranscript }}
        </div>
        <div v-if="interimTranscript" class="interim-transcript">
          <em>Interim:</em> {{ interimTranscript }}
        </div>
        <div v-if="!finalTranscript && !interimTranscript" class="no-transcript">
          {{ defaultMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'

interface Props {
  isListening: boolean
  isLoading: boolean
  isSupported: boolean
  errorMessage?: string
  currentLanguage: string
  matchedWordsCount: number
  totalWords: number
  finalTranscript: string
  interimTranscript: string
  recognitionStatus: 'listening' | 'stopped' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  errorMessage: '',
})

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'reset'): void
}>()

// Computed properties
const statusText = computed((): string => {
  if (props.isLoading) return 'Initializing...'
  if (props.errorMessage) return 'Error'
  if (props.recognitionStatus === 'listening') return 'Listening'
  if (props.recognitionStatus === 'stopped') return 'Stopped'
  if (props.recognitionStatus === 'error') return 'Error'
  return 'Ready'
})

const statusClasses = computed((): string => {
  const base = 'speech-status'
  if (props.isLoading) return `${base} speech-status--loading`
  if (props.errorMessage || props.recognitionStatus === 'error')
    return `${base} speech-status--error`
  if (props.isListening) return `${base} speech-status--listening`
  return `${base} speech-status--ready`
})

const progressPercentage = computed((): number => {
  if (props.totalWords === 0) return 0
  return Math.round((props.matchedWordsCount / props.totalWords) * 100)
})

const outputClasses = computed((): string => {
  const base = 'speech-output'
  if (props.isListening) return `${base} speech-output--listening`
  if (props.errorMessage) return `${base} speech-output--error`
  return base
})

const defaultMessage = computed((): string => {
  if (!props.isSupported) return 'Speech recognition not supported'
  if (props.isLoading) return 'Initializing speech recognition...'
  return 'Click "Start" to begin speech recognition...'
})

// Event handlers
const handleToggle = (): void => {
  if (!props.isSupported || props.isLoading) return
  emit('toggle')
}

const handleReset = (): void => {
  if (props.isListening) return
  emit('reset')
}
</script>

<style scoped>
.speech-controls-container {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 8px var(--shadow-light);
  overflow: hidden;
}

.speech-controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--primary-gradient);
  color: white;
}

.speech-controls-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.speech-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.2);
  font-size: 0.9rem;
  font-weight: 500;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--neutral-color);
  transition: all 0.3s ease;
}

.speech-status--ready .status-indicator {
  background: var(--neutral-color);
}

.speech-status--loading .status-indicator {
  background: var(--warning-color);
  animation: pulse 1.5s infinite;
}

.speech-status--listening .status-indicator {
  background: var(--success-color);
  animation: pulse 1s infinite;
}

.speech-status--error .status-indicator {
  background: var(--danger-color);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.speech-controls-actions {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  justify-content: center;
  align-items: center;
}

.speech-error {
  padding: var(--spacing-md);
  background: var(--danger-light);
  color: var(--danger-color);
  border-left: 4px solid var(--danger-color);
  margin: 0 var(--spacing-md) var(--spacing-md);
  border-radius: var(--radius-md);
}

.speech-error p {
  margin: 0;
  font-size: 0.9rem;
}

.speech-error p:not(:last-child) {
  margin-bottom: var(--spacing-xs);
}

.speech-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: var(--text-primary);
  font-weight: 600;
}

.speech-output-section {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.speech-output-section h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
}

.speech-output {
  min-height: 60px;
  padding: var(--spacing-sm);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  transition: all 0.3s ease;
}

.speech-output--listening {
  border-color: var(--success-color);
  box-shadow: 0 0 0 2px var(--success-light);
}

.speech-output--error {
  border-color: var(--danger-color);
  box-shadow: 0 0 0 2px var(--danger-light);
}

.final-transcript {
  color: var(--success-color);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.interim-transcript {
  color: var(--warning-color);
  font-style: italic;
}

.no-transcript {
  color: var(--text-secondary);
  font-style: italic;
}

/* Dark mode support */

/* Responsive design */
</style>
