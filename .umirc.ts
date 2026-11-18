import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
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
