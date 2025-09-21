<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppFooter from '@/components/specific/AppFooter.vue'
</script>

<template>
  <div class="app-container">
    <main class="app-main">
      <RouterView />
    </main>
    <AppFooter />
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
}
</style>
