import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {
    appConfig: {},
    configProvider: {
      variant: 'outlined',
      theme: {
        token: {
          colorPrimary: '#7B5BEC',
          colorLink: '#7B5BEC',
          fontFamily: 'AlibabaSans, sans-serif',
          // 全局默认圆角基准，派生规则见 antd genRadius：SM=4/XS=2/LG=8/Outer=4；
          // tailwind.css 的 --radius-* 体系已同步对齐，两套圆角保持一致
          borderRadius: 6,
        },
        components: {
          Table: {
            headerBg: '#f4f2fe', // 表头背景色
            headerColor: '#666', // 表头文字颜色
          },
          Tooltip: {
            // 全局白底气泡（含箭头）；文字色仅 Tooltip 生效，不影响 Button/Badge 等 colorTextLightSolid 使用方
            colorBgSpotlight: '#fff',
            colorTextLightSolid: 'rgba(0, 0, 0, 0.88)',
            // 白底气泡上默认阴影（最高 12% 透明度）视觉不可见，仅对 Tooltip 加深投影
            dropShadowPopover:
              'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.12)) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.16)) drop-shadow(0 9px 28px rgba(0, 0, 0, 0.08))',
          },
        },
      },
    },
  },
  access: {},
  model: {},
  initialState: {},
  request: {},
  proxy: {
    '/auth': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
      bypass: (request) => {
        const pathname = request.url?.split('?')[0];
        if (
          pathname === '/auth/verified' ||
          pathname === '/auth/verify-mail-failed'
        ) {
          return '/index.html';
        }
        return undefined;
      },
    },
    '/profile': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
    },
    '/storage': {
      target: 'http://127.0.0.1:54321',
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
      path: '/auth/verified',
      component: './AuthVerified',
      layout: false,
    },
    {
      path: '/auth/verify-mail-failed',
      component: './AuthVerifyFailed',
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
      name: '个人中心',
      path: '/profile',
      component: './Profile',
      hideInMenu: true,
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
