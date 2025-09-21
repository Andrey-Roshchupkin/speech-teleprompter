<template>
  <div class="teleprompter-display-container">
    <div class="teleprompter-header">
      <h3>📺 Teleprompter Display</h3>
      <BaseButton
        id="pip-button"
        variant="secondary"
        size="small"
        :disabled="!isPiPSupported"
        @click="handlePiPToggle"
        aria-label="Toggle Picture-in-Picture mode"
      >
        📺 PiP
      </BaseButton>
    </div>

    <div class="teleprompter-display" :class="displayClasses">
      <div class="teleprompter-text" :style="textStyles">
        <span
          v-for="(word, index) in displayWords"
          :key="index"
          :class="getWordClasses(index)"
          :data-index="index"
        >
          {{ word }}
        </span>
      </div>
    </div>

    <!-- Attachment Display -->
    <div v-if="attachment" class="teleprompter-attachment">
      <div class="attachment-content">
        <h4>{{ attachment.name }}</h4>
        <div v-if="attachment.type === 'image'" class="attachment-image">
          <img :src="attachment.content" :alt="attachment.name" />
        </div>
        <div v-else-if="attachment.type === 'video'" class="attachment-video">
          <video :src="attachment.content" controls />
        </div>
        <div v-else-if="attachment.type === 'text'" class="attachment-text">
          <p>{{ attachment.content }}</p>
        </div>
        <div v-else-if="attachment.type === 'audio'" class="attachment-audio">
          <audio :src="attachment.content" controls />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import type { Attachment } from '@/types/global'

interface Props {
  scriptText: string
  currentPosition: number
  matchedWords: string[]
  linesToShow: number
  scrollTrigger: number
  textSize: number
  isListening: boolean
  isInPiP: boolean
  attachment?: Attachment | null
}

const props = withDefaults(defineProps<Props>(), {
  attachment: null,
})

const emit = defineEmits<{
  (e: 'pip-toggle'): void
  (e: 'scroll-up'): void
  (e: 'scroll-down'): void
}>()

// Reactive state
const isPiPSupported = ref(false)

// Computed properties
const scriptWords = computed((): string[] => {
  return props.scriptText.split(/\s+/).filter((word) => word.trim().length > 0)
})

const displayWords = computed((): string[] => {
  const words = scriptWords.value
  if (words.length === 0) return []

  // If current position is beyond script length, show the end of the script
  const effectivePosition = Math.min(props.currentPosition, words.length - 1)
  const startIndex = Math.max(0, effectivePosition - Math.floor(props.linesToShow / 2))
  const endIndex = Math.min(words.length, startIndex + props.linesToShow * 10) // Approximate words per line

  return words.slice(startIndex, endIndex)
})

const displayClasses = computed((): string => {
  const classes = ['teleprompter-display']
  if (props.isListening) classes.push('teleprompter-display--listening')
  if (props.isInPiP) classes.push('teleprompter-display--pip')
  return classes.join(' ')
})

const textStyles = computed((): Record<string, string> => {
  return {
    fontSize: `${props.textSize}px`,
    lineHeight: `${props.textSize * 1.5}px`,
  }
})

// Methods
const getWordClasses = (index: number): string => {
  const classes = ['teleprompter-word']
  const words = scriptWords.value
  const startIndex = Math.max(0, props.currentPosition - Math.floor(props.linesToShow / 2))
  const globalIndex = startIndex + index

  if (globalIndex < words.length && props.matchedWords.includes(words[globalIndex])) {
    classes.push('teleprompter-word--matched')
  }

  if (globalIndex === props.currentPosition) {
    classes.push('teleprompter-word--current')
  }

  return classes.join(' ')
}

const handlePiPToggle = (): void => {
  if (!isPiPSupported.value) return

  if (props.isInPiP) {
    // Exit PiP
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture()
    }
  } else {
    // Enter PiP
    const displayElement = document.querySelector('.teleprompter-display') as any
    displayElement?.requestPictureInPicture?.()
  }

  emit('pip-toggle')
}

const checkPiPSupport = (): void => {
  isPiPSupported.value = Boolean(
    document.pictureInPictureEnabled && document.pictureInPictureElement !== undefined,
  )
}

// Lifecycle
onMounted(() => {
  checkPiPSupport()

  // Listen for PiP events
  document.addEventListener('enterpictureinpicture', () => {
    emit('pip-toggle')
  })

  document.addEventListener('leavepictureinpicture', () => {
    emit('pip-toggle')
  })
})

onUnmounted(() => {
  document.removeEventListener('enterpictureinpicture', () => {
    emit('pip-toggle')
  })

  document.removeEventListener('leavepictureinpicture', () => {
    emit('pip-toggle')
  })
})

// Watch for scroll triggers
watch(
  () => props.currentPosition,
  (newPosition, oldPosition) => {
    if (newPosition > oldPosition && newPosition % props.scrollTrigger === 0) {
      emit('scroll-down')
    } else if (newPosition < oldPosition && newPosition % props.scrollTrigger === 0) {
      emit('scroll-up')
    }
  },
)
</script>

<style scoped>
.teleprompter-display-container {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 8px var(--shadow-light);
  overflow: hidden;
}

.teleprompter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--primary-gradient);
  color: white;
}

.teleprompter-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.teleprompter-display {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
}

.teleprompter-display--listening {
  border-color: var(--success-color);
  box-shadow: 0 0 0 3px var(--success-light);
}

.teleprompter-display--pip {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.teleprompter-text {
  font-family: 'Courier New', monospace;
  line-height: 1.5;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.teleprompter-word {
  display: inline;
  margin-right: 0.25em;
  transition: all 0.2s ease;
  border-radius: 2px;
  padding: 1px 2px;
}

.teleprompter-word--current {
  background-color: var(--primary-light);
  color: var(--primary-color);
  font-weight: 600;
}

.teleprompter-word--matched {
  background-color: var(--success-light);
  color: var(--success-color);
  text-decoration: line-through;
}

.teleprompter-attachment {
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-top: 1px solid var(--border-color);
}

.attachment-content h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: 1.1rem;
}

.attachment-content p {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.attachment-image img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.attachment-video video {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.attachment-text p {
  background: var(--bg-secondary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--primary-color);
}

/* Dark mode support */

/* Responsive design */
</style>
