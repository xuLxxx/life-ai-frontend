import type { history } from '@umijs/max';

const ACCESS_TOKEN_KEY = 'life_ai_access_token';
const AUTH_USER_KEY = 'life_ai_user';

export type AuthUser = {
  id?: string;
  email?: string;
  displayName?: string;
  [key: string]: unknown;
};

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const value = localStorage.getItem(AUTH_USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function findToken(value: unknown, depth = 0): string | undefined {
  if (!value || typeof value !== 'object' || depth > 4) return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ['access_token', 'accessToken', 'token']) {
    if (typeof record[key] === 'string' && record[key]) {
      return record[key] as string;
    }
  }
  for (const key of ['session', 'data', 'result']) {
    const token = findToken(record[key], depth + 1);
    if (token) return token;
  }
  return undefined;
}

function findUser(value: unknown, depth = 0): AuthUser | null {
  if (!value || typeof value !== 'object' || depth > 4) return null;
  const record = value as Record<string, unknown>;
  if (record.user && typeof record.user === 'object') {
    return record.user as AuthUser;
  }
  for (const key of ['session', 'data', 'result']) {
    const user = findUser(record[key], depth + 1);
    if (user) return user;
  }
  return null;
}

export function saveAuthResponse(value: unknown): boolean {
  const token = findToken(value);
  if (!token) return false;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  const user = findUser(value);
  if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  return true;
}

export function saveAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function saveVerificationEmail(email: string): void {
  sessionStorage.setItem('life_ai_verification_email', email);
}

export function getVerificationEmail(): string | null {
  return sessionStorage.getItem('life_ai_verification_email');
}

export function redirectToLogin(appHistory: typeof history): void {
  const pathname = window.location.pathname;
  if (pathname === '/login' || pathname === '/verify-email') return;
  const redirect = `${pathname}${window.location.search}`;
  appHistory.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
}

export function readAuthTokenFromUrl(): string | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  return (
    search.get('access_token') ??
    search.get('accessToken') ??
    hash.get('access_token') ??
    hash.get('accessToken') ??
    null
  );
}
