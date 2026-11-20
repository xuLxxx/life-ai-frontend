// 运行时配置

import { getRequestInstance, history } from '@umijs/max';
import { getCurrentUser } from '@/services/profile';
import {
  ensureAccessToken,
  getAccessToken,
  refreshAccessTokenFromCookie,
} from '@/utils/auth';
import { requestErrorConfig } from '../config/requestErrorConfig';

const PUBLIC_PATHS = [
  '/login',
  '/verify-email',
  '/auth/verified',
  '/auth/verify-mail-failed',
];

export async function getInitialState() {
  const token = await ensureAccessToken();
  const currentUser = token ? await getCurrentUser().catch(() => null) : null;
  return {
    currentUser,
    name: currentUser?.displayName || currentUser?.email || '@umijs/max',
  };
}

export const layout = () => ({
  logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
  menu: { locale: false },
  onPageChange: () => {
    if (
      !getAccessToken() &&
      !PUBLIC_PATHS.includes(history.location.pathname)
    ) {
      const redirect = `${history.location.pathname}${history.location.search}`;
      history.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
    }
  },
});

export const request = {
  requestInterceptors: [
    (url: string, options: Record<string, unknown>) => {
      const token = getAccessToken();
      return {
        url,
        options: {
          ...options,
          withCredentials: true,
          headers: {
            ...(options.headers as Record<string, unknown>),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      };
    },
  ],
  responseInterceptors: [
    (response: {
      data?: {
        code?: number | string;
        message?: string;
        success?: boolean;
        data?: unknown;
      };
      config?: Record<string, unknown> & { url?: string; _retry?: boolean };
    }) => {
      const payload = response.data;
      if (payload && typeof payload.success === 'boolean') {
        if (payload.success) {
          return { ...response, data: payload.data };
        }
        throw Object.assign(new Error(payload.message || '请求失败'), {
          config: response.config,
          data: payload,
          code: payload.code,
          success: false,
        });
      }
      return response;
    },
    [
      (response: unknown) => response,
      async (error: {
        response?: { status?: number };
        config?: Record<string, unknown> & { url?: string; _retry?: boolean };
        data?: { code?: number | string; success?: boolean };
        code?: number | string;
      }) => {
        const originalRequest = error.config;
        const businessCode = error.data?.code ?? error.code;
        if (
          (error.response?.status === 401 || Number(businessCode) === 401) &&
          originalRequest &&
          originalRequest.url !== '/auth/refresh-token' &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true;
          const refreshed = await refreshAccessTokenFromCookie();
          if (refreshed) {
            return getRequestInstance().request({
              ...originalRequest,
              withCredentials: true,
              headers: {
                ...(originalRequest.headers as Record<string, unknown>),
                Authorization: `Bearer ${getAccessToken()}`,
              },
            });
          }
        }
        throw error;
      },
    ],
  ],
  errorConfig: requestErrorConfig,
};
