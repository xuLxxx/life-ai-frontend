import type { AuthUser } from '@/utils/auth';
import { request } from '@umijs/max';

export async function getCurrentUser() {
  return request<AuthUser>('/profile/me', { method: 'GET' });
}
