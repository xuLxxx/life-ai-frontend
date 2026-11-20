import { request } from '@umijs/max';

export type SignUpPayload = {
  email: string;
  password: string;
  displayName: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export async function signUp(data: SignUpPayload) {
  return request('/auth/sign-up', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function signIn(data: SignInPayload) {
  return request('/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    data,
  });
}

export async function refreshAccessToken() {
  return request('/auth/refresh-token', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function resendVerification(email: string) {
  return request('/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { email },
  });
}
