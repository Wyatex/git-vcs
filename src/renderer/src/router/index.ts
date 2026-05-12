import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'root',
    component: () => import('@/components/app-layout.vue'),
    children: [

    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
