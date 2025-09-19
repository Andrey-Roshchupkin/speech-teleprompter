import { ref, computed, nextTick, readonly } from 'vue'
import type { Ref } from 'vue'
import { useAttachmentManager } from './useAttachmentManager'

export interface TeleprompterDisplaySettings {
  linesToShow: number
  scrollTrigger: number
  textSize: number
}

export interface UseTeleprompterDisplayOptions {
  onPositionChange?: (position: number) => void
  onProgressChange?: (progress: number) => void
}

export const useTeleprompterDisplay = (options: UseTeleprompterDisplayOptions = {}) => {
  // Initialize attachment manager
  const attachmentManager = useAttachmentManager()

  // Reactive state
  const scriptText = ref('')
  const currentPosition = ref(0)
  const matchedWords = ref<number[]>([])
  const settings = ref<TeleprompterDisplaySettings>({
    linesToShow: 5,
    scrollTrigger: 3,
    textSize: 24,
  })

  // Computed properties
  const scriptWords = computed(() => {
    // Get display text with attachments replaced by names
    const displayText = attachmentManager.getDisplayText(scriptText.value)
    return displayText.split(/\s+/).filter((word) => word.length > 0)
  })

  const totalWords = computed(() => scriptWords.value.length)

  const progress = computed(() => {
    if (totalWords.value === 0) return 0
    return Math.round((currentPosition.value / totalWords.value) * 100)
  })

  const displayedWords = computed(() => {
    // Return ALL words, not limited by linesToShow
    // linesToShow is only used for container height, not word count
    return scriptWords.value
  })

  const wordStates = computed(() => {
    const words = displayedWords.value
    const states: Array<'current' | 'matched' | 'passed' | 'normal'> = new Array(words.length).fill(
      'normal',
    )

    for (let i = 0; i < words.length; i++) {
      // Current position (next word to speak)
      if (i === currentPosition.value) {
        states[i] = 'current'
      }
      // Matched words (already spoken)
      else if (matchedWords.value.includes(i)) {
        states[i] = 'matched'
      }
      // Passed words (before current position)
      else if (i < currentPosition.value) {
        states[i] = 'passed'
      }
    }

    return states
  })

  /**
   * Update script text
   */
  const updateScript = (newScriptText: string): void => {
    scriptText.value = newScriptText

    // Parse attachments from the script
    attachmentManager.parseAttachments(newScriptText)

    // Set original script words for position conversion
    const originalWords = newScriptText.split(/\s+/).filter((word) => word.length > 0)
    attachmentManager.setOriginalScriptWords(originalWords)

    currentPosition.value = 0
    matchedWords.value = []

    // Show first attachment if available - use nextTick to ensure scriptWords is updated
    nextTick(() => {
      attachmentManager.showFirstAttachment(scriptWords.value)
    })

    if (options.onPositionChange) {
      options.onPositionChange(currentPosition.value)
    }
    if (options.onProgressChange) {
      options.onProgressChange(progress.value)
    }
  }

  /**
   * Update settings
   */
  const updateSettings = (newSettings: Partial<TeleprompterDisplaySettings>): void => {
    settings.value = { ...settings.value, ...newSettings }
  }

  /**
   * Update position and matched words
   */
  const updatePosition = (newPosition: number, newMatchedIndices: number[]): void => {
    currentPosition.value = newPosition
    matchedWords.value = newMatchedIndices

    // Update attachment display based on current position
    attachmentManager.updateAttachmentDisplay(currentPosition.value, scriptWords.value)

    if (options.onPositionChange) {
      options.onPositionChange(currentPosition.value)
    }
    if (options.onProgressChange) {
      options.onProgressChange(progress.value)
    }
  }

  /**
   * Reset teleprompter
   */
  const reset = (): void => {
    currentPosition.value = 0
    matchedWords.value = []
    attachmentManager.reset()

    // Show first attachment if available after reset - use nextTick to ensure scriptWords is updated
    nextTick(() => {
      attachmentManager.showFirstAttachment(scriptWords.value)
    })

    if (options.onPositionChange) {
      options.onPositionChange(currentPosition.value)
    }
    if (options.onProgressChange) {
      options.onProgressChange(progress.value)
    }
  }

  /**
   * Get current position
   */
  const getCurrentPosition = (): number => {
    return currentPosition.value
  }

  /**
   * Get total words
   */
  const getTotalWords = (): number => {
    return totalWords.value
  }

  /**
   * Get progress percentage
   */
  const getProgress = (): number => {
    return progress.value
  }

  /**
   * Get original script words (for fuzzy matching)
   */
  const getOriginalScriptWords = (): string[] => {
    return scriptWords.value
  }

  /**
   * Scroll to specific position
   */
  const scrollToPosition = (position: number): void => {
    currentPosition.value = Math.max(0, Math.min(position, totalWords.value))

    if (options.onPositionChange) {
      options.onPositionChange(currentPosition.value)
    }
    if (options.onProgressChange) {
      options.onProgressChange(progress.value)
    }
  }

  /**
   * Scroll up by one line
   */
  const scrollUp = (): void => {
    const newPosition = Math.max(0, currentPosition.value - settings.value.scrollTrigger)
    scrollToPosition(newPosition)
  }

  /**
   * Scroll down by one line
   */
  const scrollDown = (): void => {
    const newPosition = Math.min(
      totalWords.value,
      currentPosition.value + settings.value.scrollTrigger,
    )
    scrollToPosition(newPosition)
  }

  return {
    // State
    scriptText,
    currentPosition: readonly(currentPosition),
    matchedWords: readonly(matchedWords),
    settings,
    attachmentManager,

    // Computed
    scriptWords: readonly(scriptWords),
    totalWords: readonly(totalWords),
    progress: readonly(progress),
    displayedWords: readonly(displayedWords),
    wordStates: readonly(wordStates),

    // Methods
    updateScript,
    updateSettings,
    updatePosition,
    reset,
    getCurrentPosition,
    getTotalWords,
    getProgress,
    getOriginalScriptWords,
    scrollToPosition,
    scrollUp,
    scrollDown,
  }
}
