<template>
  <div class="settings-panel-container">
    <div class="settings-header">
      <h3>⚙️ Teleprompter Settings</h3>
    </div>

    <div class="settings-content">
      <!-- Inline Settings (4 parameters from original) -->
      <div class="settings-inline">
        <div class="setting-column">
          <label for="linesToShow">Lines to Show</label>
          <BaseInput
            id="lines-to-show"
            v-model="localSettings.linesToShow"
            type="number"
            :min="3"
            :max="10"
            @update:model-value="handleSettingChange('linesToShow', $event)"
          />
        </div>

        <div class="setting-column">
          <label for="scrollTrigger">Scroll After Lines</label>
          <BaseInput
            id="scroll-trigger"
            v-model="localSettings.scrollTrigger"
            type="number"
            :min="1"
            :max="4"
            @update:model-value="handleSettingChange('scrollTrigger', $event)"
          />
        </div>

        <div class="setting-column">
          <label for="textSize">Text Size (px)</label>
          <BaseInput
            id="text-size"
            v-model="localSettings.textSize"
            type="number"
            :min="12"
            :max="48"
            @update:model-value="handleSettingChange('textSize', $event)"
          />
        </div>

        <div class="setting-column">
          <label for="fuzzyPrecision">Fuzzy Match Precision</label>
          <BaseInput
            id="fuzzy-precision"
            v-model="localSettings.fuzzyPrecision"
            type="number"
            :min="50"
            :max="95"
            :step="5"
            @update:model-value="handleSettingChange('fuzzyPrecision', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'

interface TeleprompterSettings {
  linesToShow: number
  scrollTrigger: number
  textSize: number
  fuzzyPrecision: number
}

interface Props {
  settings: TeleprompterSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => ({
    linesToShow: 5,
    scrollTrigger: 3,
    textSize: 24,
    fuzzyPrecision: 65,
  }),
})

const emit = defineEmits<{
  (e: 'update:settings', settings: TeleprompterSettings): void
}>()

// Local state
const localSettings = ref<TeleprompterSettings>({ ...props.settings })

// Methods
const handleSettingChange = (key: keyof TeleprompterSettings, value: any): void => {
  // Convert string numbers to actual numbers for numeric inputs
  if (typeof value === 'string' && !isNaN(Number(value))) {
    value = Number(value)
  }

  ;(localSettings.value as any)[key] = value

  // Emit the updated settings
  emit('update:settings', { ...localSettings.value })
}

// Watch for prop changes
watch(
  () => props.settings,
  (newSettings) => {
    localSettings.value = { ...newSettings }
  },
  { deep: true },
)
</script>

<style scoped>
.settings-panel-container {
  background-color: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.settings-header {
  margin-bottom: var(--spacing-lg);
}

.settings-header h3 {
  color: var(--text-color-primary);
  font-size: var(--font-size-xl);
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.settings-inline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-md);
  background-color: var(--bg-input);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color-light);
}

.setting-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.setting-column label {
  font-weight: var(--font-weight-medium);
  color: var(--text-color-primary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

/* Responsive design */

</style>
