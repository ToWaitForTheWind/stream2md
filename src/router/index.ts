/**
 * 路由配置
 */
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/demo'
    },
    {
      path: '/demo',
      name: 'demo',
      component: () => import('@/views/DemoView.vue')
    },
    {
      path: '/demo-html',
      name: 'demo-html',
      component: () => import('@/views/DemoHtmlView.vue')
    }
  ]
})

export default router

