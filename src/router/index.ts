import { createRouter, createWebHistory } from 'vue-router'
import TeleprompterView from '../views/TeleprompterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'teleprompter',
      component: TeleprompterView,
    },
  ],
})

export default router
