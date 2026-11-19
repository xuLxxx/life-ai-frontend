// 运行时配置
import { clearAuthSession, getAccessToken, getStoredUser } from '@/utils/auth';
import { history } from '@umijs/max';
import { message } from 'antd';

export async function getInitialState() {
  const user = getStoredUser();
  return {
    name: user?.displayName || user?.email || '@umijs/max',
    currentUser: user,
  };
}

export const layout = () => ({
  logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
  menu: { locale: false },
  onPageChange: () => {
    const publicPaths = ['/login', '/verify-email'];
    if (!getAccessToken() && !publicPaths.includes(history.location.pathname)) {
      const redirect = `${history.location.pathname}${history.location.search}`;
      history.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  },
});

export const request = {
  requestInterceptors: [
    (url: string, options: RequestInit) => {
      const token = getAccessToken();
      if (!token) return { url, options };
      return {
        url,
        options: {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`,
          },
        },
      };
    },
  ],
  errorConfig: {
    errorHandler: (error: {
      response?: Response;
      data?: { message?: string };
      message?: string;
    }) => {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        clearAuthSession();
        const pathname = history.location.pathname;
        if (pathname !== '/login' && pathname !== '/verify-email') {
          message.warning('登录状态已失效，请重新登录');
          const redirect = `${pathname}${history.location.search}`;
          history.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        }
      }
      throw error;
    },
  },
};
