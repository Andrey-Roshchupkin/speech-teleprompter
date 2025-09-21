<template>
  <a
    :href="href"
    :target="target"
    :rel="rel"
    :aria-label="ariaLabel"
    :class="linkClasses"
    @click="handleClick"
  >
    <span v-if="icon" class="link-icon" :aria-hidden="true">{{ icon }}</span>
    <slot />
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  href: string
  target?: '_blank' | '_self' | '_parent' | '_top'
  rel?: string
  ariaLabel?: string
  icon?: string
  variant?: 'default' | 'footer' | 'button'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  target: '_self',
  rel: '',
  variant: 'default',
  size: 'md',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const linkClasses = computed(() => [
  'base-link',
  `base-link--${props.variant}`,
  `base-link--${props.size}`,
])

const handleClick = (event: MouseEvent) => {
  emit('click', event)
}
</script>

<style scoped>
.base-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
}

.base-link--default {
  color: var(--primary-color);
  padding: 4px 8px;
}

.base-link--default:hover {
  color: var(--primary-gradient-end);
  background: var(--primary-light);
}

.base-link--footer {
  color: var(--text-secondary);
  padding: 8px 12px;
}

.base-link--footer:hover {
  color: var(--primary-color);
  background: var(--primary-light);
  border-color: var(--primary-color);
  transform: translateX(5px);
}

.base-link--button {
  color: var(--text-light);
  background: var(--bg-gradient);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 8px var(--primary-medium);
}

.base-link--button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--primary-medium);
  background: linear-gradient(
    135deg,
    var(--primary-gradient-end) 0%,
    var(--primary-gradient-start) 100%
  );
}

.base-link--sm {
  font-size: 12px;
  padding: 4px 8px;
}

.base-link--md {
  font-size: 14px;
  padding: 8px 12px;
}

.base-link--lg {
  font-size: 16px;
  padding: 12px 16px;
}

.link-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

/* Focus styles for accessibility */
.base-link:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.base-link:focus:not(:focus-visible) {
  outline: none;
}
</style>
