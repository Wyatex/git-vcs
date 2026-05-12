import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/app-layout.vue'),
    redirect: '/overview',
    children: [
      {
        path: 'overview',
        name: 'overview',
        component: () => import('@/views/overview/index.vue')
      },
      {
        path: 'commit',
        name: 'commit',
        component: () => import('@/views/commit/index.vue')
      },
      {
        path: 'branches',
        name: 'branches',
        component: () => import('@/views/branches/index.vue')
      },
      {
        path: 'tags',
        name: 'tags',
        component: () => import('@/views/tags/index.vue')
      },
      {
        path: 'stash',
        name: 'stash',
        component: () => import('@/views/stash/index.vue')
      },
      {
        path: 'history',
        name: 'history',
        component: () => import('@/views/history/index.vue')
      },
      {
        path: 'merge',
        name: 'merge',
        component: () => import('@/views/merge/index.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/overview'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
