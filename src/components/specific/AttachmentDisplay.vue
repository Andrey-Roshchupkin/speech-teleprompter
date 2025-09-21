<template>
  <div v-if="currentAttachment" class="teleprompter-attachment" :style="attachmentStyle">
    <div class="teleprompter-attachment-title" :style="titleStyle">
      {{ currentAttachment.name }}
    </div>
    <div class="teleprompter-attachment-content">{{ currentAttachment.content }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Attachment } from '@/types/global'

interface Props {
  currentAttachment: Attachment | null
  textSize: number
}

const props = withDefaults(defineProps<Props>(), {
  currentAttachment: null,
  textSize: 24,
})

// Computed style for font size
const attachmentStyle = computed(() => ({
  fontSize: `${props.textSize}px`,
}))

const titleStyle = computed(() => ({
  fontSize: `${Math.max(props.textSize - 2, 12)}px`,
}))
</script>

<style scoped>
.teleprompter-attachment {
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.teleprompter-attachment-title {
  font-weight: bold;
  color: #495057;
  margin-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 4px;
}

.teleprompter-attachment-content {
  color: #6c757d;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
