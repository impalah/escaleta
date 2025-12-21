import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/canvas'
  },
  {
    path: '/canvas',
    name: 'canvas',
    component: () => import('@/presentation/views/BeatEditorView.vue'),
    meta: {
      title: 'Canvas View'
    }
  },
  {
    path: '/grid',
    name: 'grid',
    component: () => import('@/presentation/views/BeatGridViewPage.vue'),
    meta: {
      title: 'Grid View'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/canvas'
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
