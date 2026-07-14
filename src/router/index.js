import { createRouter, createWebHistory } from 'vue-router'
import FestivalDashboard from '@/views/FestivalDashboard.vue'

const routes = [
  {
    path: '/',
    name: 'FestivalDashboard',
    component: FestivalDashboard,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router