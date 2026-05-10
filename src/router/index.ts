import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue')
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/HistoryView.vue')
  },
  {
    path: '/branches',
    name: 'branches',
    component: () => import('@/views/BranchView.vue')
  },
  {
    path: '/tags',
    name: 'tags',
    component: () => import('@/views/TagView.vue')
  },
  {
    path: '/merge',
    name: 'merge',
    component: () => import('@/views/MergeView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
