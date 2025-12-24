import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/timeline'
  },
  {
    path: '/timeline',
    name: 'timeline',
    component: () => import('@/presentation/views/TimelineView.vue'),
    meta: {
      title: 'Timeline View'
    }
  },
  {
    path: '/rundown',
    name: 'rundown',
    component: () => import('@/presentation/views/RundownView.vue'),
    meta: {
      title: 'Rundown View'
    }
  },
  {
    path: '/fountain',
    name: 'fountain',
    component: () => import('@/presentation/views/FountainView.vue'),
    meta: {
      title: 'Fountain View'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/timeline'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Optional: Update document title on route change
router.beforeEach((to, _from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `Escaleta - ${title}`
  }
  next()
})

export default router
