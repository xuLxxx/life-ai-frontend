import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  proxy: {
    '/auth': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
    },
    '/profile': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
    },
  },
  reactQuery: {
    queryClient: {
      defaultOptions: {
        queries: {
          // 🟡 此配置具有的表现往往令人出乎意料，若无特殊需求，请默认关闭
          refetchOnWindowFocus: false,
        },
      },
    },
  },
  layout: {
    title: '@umijs/max',
  },
  routes: [
    {
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      path: '/verify-email',
      component: './VerifyEmail',
      layout: false,
    },
    {
      path: '/',
      redirect: '/home',
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
    },
    {
      name: '权限演示',
      path: '/access',
      component: './Access',
    },
    {
      name: ' CRUD 示例',
      path: '/table',
      component: './Table',
    },
  ],

  npmClient: 'pnpm',
  utoopack: {},
  tailwindcss: {},
});
