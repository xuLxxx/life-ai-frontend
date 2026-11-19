// 运行时配置

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
// 更多信息见文档：https://umijs.org/docs/api/runtime-config#getinitialstate
export async function getInitialState(): Promise<{ name: string }> {
  return {
    name: '@umijs/max',
    // antd: {
    //   appConfig: {},
    //   configProvider: {
    //     variant: 'outlined',
    //     theme: {
    //       token: {
    //         colorPrimary: '#7B5BEC',
    //         colorLink: '#7B5BEC',
    //         fontFamily: 'AlibabaSans, sans-serif',
    //         // 全局默认圆角基准，派生规则见 antd genRadius：SM=4/XS=2/LG=8/Outer=4；
    //         // tailwind.css 的 --radius-* 体系已同步对齐，两套圆角保持一致
    //         borderRadius: 6,
    //       },
    //       components: {
    //         Table: {
    //           headerBg: '#f4f2fe', // 表头背景色
    //           headerColor: '#666', // 表头文字颜色
    //         },
    //         Tooltip: {
    //           // 全局白底气泡（含箭头）；文字色仅 Tooltip 生效，不影响 Button/Badge 等 colorTextLightSolid 使用方
    //           colorBgSpotlight: '#fff',
    //           colorTextLightSolid: 'rgba(0, 0, 0, 0.88)',
    //           // 白底气泡上默认阴影（最高 12% 透明度）视觉不可见，仅对 Tooltip 加深投影
    //           dropShadowPopover:
    //             'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.12)) drop-shadow(0 3px 6px rgba(0, 0, 0, 0.16)) drop-shadow(0 9px 28px rgba(0, 0, 0, 0.08))',
    //         },
    //       },
    //     },
    //   },
    // },
  };
}

export const layout = () => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: false,
    },
  };
};
