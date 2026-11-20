import { clearAuthSession } from '@/utils/auth';
import { history } from '@umijs/max';
import { message } from 'antd';

const PUBLIC_PATHS = [
  '/login',
  '/verify-email',
  '/auth/verified',
  '/auth/verify-mail-failed',
];

type ApiErrorPayload = {
  message?: string | string[];
  success?: boolean;
  error?: string;
  statusCode?: number;
  code?: number | string;
  data?: unknown;
};

export type ApiResponse<T = unknown> = {
  code: number | string;
  message: string;
  success: boolean;
  data: T;
};

export type RequestError = {
  response?: Response;
  data?: ApiErrorPayload;
  message?: string;
  code?: number | string;
  success?: boolean;
  config?: Record<string, unknown>;
};

function getErrorMessage(error: RequestError): string {
  const backendMessage = error.data?.message;
  if (Array.isArray(backendMessage)) {
    return backendMessage.join('；') || '请求失败，请稍后重试';
  }
  return (
    backendMessage ||
    error.data?.error ||
    error.message ||
    '请求失败，请稍后重试'
  );
}

export function getBusinessCode(
  error: RequestError,
): number | string | undefined {
  return error.data?.code ?? error.code;
}

export function isUnauthorizedCode(code: number | string | undefined): boolean {
  return Number(code) === 401;
}

export const requestErrorConfig = {
  errorHandler: (error: RequestError) => {
    const status = error.response?.status ?? error.data?.statusCode;
    const code = getBusinessCode(error);
    const errorMessage = getErrorMessage(error);

    if (status === 401 || isUnauthorizedCode(code)) {
      clearAuthSession();
      const pathname = history.location.pathname;
      if (!PUBLIC_PATHS.includes(pathname)) {
        message.warning(errorMessage || '登录状态已失效，请重新登录');
        const redirect = `${pathname}${history.location.search}`;
        history.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      } else {
        message.error(errorMessage);
      }
    } else if (status !== undefined && status >= 400) {
      message.error(errorMessage);
    } else {
      message.error(errorMessage);
    }
  },
};
