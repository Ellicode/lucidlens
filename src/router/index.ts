import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/article/:id',
      name: 'detail',
      component: () => import('../views/DetailView.vue'),
      props: true,
    },
  ],
})

export default router
