import type { history } from '@umijs/max';

const LEGACY_ACCESS_TOKEN_KEY = 'life_ai_access_token';
const LEGACY_AUTH_USER_KEY = 'life_ai_auth_user';
const LOGGED_OUT_KEY = 'life_ai_logged_out';
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

export type AuthUser = {
  id?: string;
  email?: string;
  displayName?: string;
  [key: string]: unknown;
};

export function getAccessToken(): string | null {
  return accessToken;
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
  const user: AuthUser = {};
  for (const key of ['id', 'email', 'displayName']) {
    if (key in record) user[key] = record[key];
  }
  if (Object.keys(user).length > 0) return user;
  for (const key of ['session', 'data', 'result']) {
    const nestedUser = findUser(record[key], depth + 1);
    if (nestedUser) return nestedUser;
  }
  return null;
}

export function saveAuthResponse(value: unknown): AuthUser | null {
  const token = findToken(value);
  if (!token) return null;
  accessToken = token;
  sessionStorage.removeItem(LOGGED_OUT_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_AUTH_USER_KEY);
  return findUser(value);
}

export function saveAccessToken(token: string): void {
  accessToken = token;
  sessionStorage.removeItem(LOGGED_OUT_KEY);
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
}

export function clearAuthSession(): void {
  accessToken = null;
  sessionStorage.setItem(LOGGED_OUT_KEY, '1');
  localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
}

function isTokenExpiringSoon(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return false;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { exp?: number };
    return Boolean(decoded.exp && decoded.exp * 1000 <= Date.now() + 30_000);
  } catch {
    return false;
  }
}

export async function refreshAccessTokenFromCookie(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch('/auth/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return false;
      saveAuthResponse(await response.json());
      return Boolean(accessToken);
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function ensureAccessToken(): Promise<string | null> {
  if (accessToken && !isTokenExpiringSoon(accessToken)) return accessToken;
  if (sessionStorage.getItem(LOGGED_OUT_KEY) === '1') return null;
  await refreshAccessTokenFromCookie();
  return accessToken;
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
