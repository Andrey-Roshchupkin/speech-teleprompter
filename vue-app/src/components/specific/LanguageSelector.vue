<template>
  <div class="language-selector-container">
    <div class="language-selector-header">
      <h3>🌍 Language Settings</h3>
    </div>

    <div class="language-selector-content">
      <!-- Primary Language Selection -->
      <div class="language-section">
        <div class="setting-group">
          <label for="primaryLanguage">Primary Language:</label>
          <BaseSelect
            id="primary-language"
            v-model="localSettings.primaryLanguage"
            placeholder="Select your primary language"
            :options="supportedLanguages as any"
            @update:model-value="handleLanguageChange"
          />
        </div>
      </div>

      <!-- Language Info -->
      <div class="language-info">
        <p>
          <strong>Language Selection:</strong> Choose your primary language for speech recognition.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { SUPPORTED_LANGUAGES, type LanguageOption } from '@/types/global'

interface Props {
  primaryLanguage: string
}

const props = withDefaults(defineProps<Props>(), {
  primaryLanguage: 'en-US',
})

const emit = defineEmits<{
  (e: 'update:primaryLanguage', value: string): void
}>()

// Local state
const localSettings = ref({
  primaryLanguage: props.primaryLanguage,
})

// Computed properties
const supportedLanguages = computed((): readonly LanguageOption[] => {
  return SUPPORTED_LANGUAGES
})

const selectedLanguageInfo = computed((): LanguageOption | null => {
  return (
    supportedLanguages.value.find((lang) => lang.code === localSettings.value.primaryLanguage) ??
    null
  )
})

// Methods
const handleLanguageChange = (value: string): void => {
  localSettings.value.primaryLanguage = value
  emit('update:primaryLanguage', value)
}

// Watch for prop changes
watch(
  () => props.primaryLanguage,
  (newValue) => {
    localSettings.value.primaryLanguage = newValue
  },
)
</script>

<style scoped>
.language-selector-container {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.language-selector-header {
  margin-bottom: var(--spacing-lg);
}

.language-selector-header h3 {
  color: var(--text-color-primary);
  font-size: var(--font-size-xl);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.language-selector-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.language-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-group label {
  font-weight: var(--font-weight-medium);
  color: var(--text-color-primary);
  font-size: var(--font-size-md);
}

.language-info {
  background-color: var(--bg-input);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.language-info p {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-md);
}

.language-info strong {
  color: var(--text-color-primary);
  font-weight: var(--font-weight-medium);
}

/* Responsive design */
</style>
