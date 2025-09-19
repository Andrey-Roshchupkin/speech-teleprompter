import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'

// Тестируем логику разделения текста
describe('Text Segmentation Logic', () => {
  const words = ['Welcome', 'to', 'our', 'presentation.', 'Today', 'we', 'will', 'be', 'discussing']
  const currentPosition = ref(0)

  const textBeforePointer = computed(() => {
    const currentPos = currentPosition.value
    if (currentPos <= 0) return ''
    return words.slice(0, currentPos).join(' ') + ' '
  })

  const currentWord = computed(() => {
    const currentPos = currentPosition.value
    if (currentPos >= words.length) return ''
    return words[currentPos] || ''
  })

  const textAfterPointer = computed(() => {
    const currentPos = currentPosition.value
    if (currentPos >= words.length - 1) return ''
    return ' ' + words.slice(currentPos + 1).join(' ')
  })

  describe('textBeforePointer', () => {
    it('should return empty string when currentPosition is 0', () => {
      currentPosition.value = 0
      expect(textBeforePointer.value).toBe('')
    })

    it('should return words before current position when currentPosition > 0', () => {
      currentPosition.value = 3
      expect(textBeforePointer.value).toBe('Welcome to our ')
    })

    it('should return all words except last when currentPosition is last word', () => {
      currentPosition.value = 8
      expect(textBeforePointer.value).toBe('Welcome to our presentation. Today we will be ')
    })
  })

  describe('currentWord', () => {
    it('should return first word when currentPosition is 0', () => {
      currentPosition.value = 0
      expect(currentWord.value).toBe('Welcome')
    })

    it('should return correct word for any position', () => {
      currentPosition.value = 3
      expect(currentWord.value).toBe('presentation.')
    })

    it('should return empty string when currentPosition is beyond words length', () => {
      currentPosition.value = 999
      expect(currentWord.value).toBe('')
    })
  })

  describe('textAfterPointer', () => {
    it('should return all words after current position with leading space when currentPosition is 0', () => {
      currentPosition.value = 0
      expect(textAfterPointer.value).toBe(' to our presentation. Today we will be discussing')
    })

    it('should return words after current position when currentPosition is middle', () => {
      currentPosition.value = 3
      expect(textAfterPointer.value).toBe(' Today we will be discussing')
    })

    it('should return empty string when currentPosition is last word', () => {
      currentPosition.value = 8
      expect(textAfterPointer.value).toBe('')
    })

    it('should return empty string when currentPosition is beyond words length', () => {
      currentPosition.value = 999
      expect(textAfterPointer.value).toBe('')
    })
  })

  describe('Complete text reconstruction', () => {
    it('should reconstruct original text correctly for position 0', () => {
      currentPosition.value = 0
      const reconstructed = textBeforePointer.value + currentWord.value + textAfterPointer.value
      expect(reconstructed).toBe('Welcome to our presentation. Today we will be discussing')
    })

    it('should reconstruct original text correctly for position 2', () => {
      currentPosition.value = 2
      const reconstructed = textBeforePointer.value + currentWord.value + textAfterPointer.value
      expect(reconstructed).toBe('Welcome to our presentation. Today we will be discussing')
    })

    it('should reconstruct original text correctly for position 3', () => {
      currentPosition.value = 3
      const reconstructed = textBeforePointer.value + currentWord.value + textAfterPointer.value
      expect(reconstructed).toBe('Welcome to our presentation. Today we will be discussing')
    })

    it('should reconstruct original text correctly for position 5', () => {
      currentPosition.value = 5
      const reconstructed = textBeforePointer.value + currentWord.value + textAfterPointer.value
      expect(reconstructed).toBe('Welcome to our presentation. Today we will be discussing')
    })
  })
})
