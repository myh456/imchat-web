import { createRouter, createWebHistory } from 'vue-router'

const routes = [{
    path: '/',
    redirect: '/main'
  },{
    path: '/main',
    name: '主页',
    component: () => import("../views/mainPage.vue")
  }, {
    path: '/login',
    name: '登陆',
    component: () => import('../views/loginPage.vue')
  }, {
    path: '/chat',
    name: '对话',
    component: () => import('../views/chatPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router