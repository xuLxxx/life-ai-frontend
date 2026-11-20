import type { AuthUser } from '@/utils/auth';
import { request } from '@umijs/max';

export type UpdateProfilePayload = {
  displayName?: string;
  bio?: string | null;
  avatarPath?: string | null;
};

export type AvatarUploadResult = {
  path: string;
  token: string;
};

export async function getCurrentUser() {
  return request<AuthUser>('/profile/me', { method: 'GET' });
}

export async function updateCurrentUser(data: UpdateProfilePayload) {
  return request<AuthUser>('/profile/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

export async function createAvatarUpload(extension: string) {
  return request<AvatarUploadResult>('/profile/avatar/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { extension },
  });
}

export async function getAvatarUrl(path: string) {
  return request<{ url: string }>('/profile/avatar/url', {
    method: 'GET',
    params: { path },
  });
}

export async function uploadAvatarFile(
  file: File,
  { path, token }: AvatarUploadResult,
) {
  const encodedPath = path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const uploadUrl = `/storage/v1/object/upload/sign/avatars/${encodedPath}?token=${encodeURIComponent(token)}`;
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!response.ok) {
    throw new Error(`头像上传失败（${response.status}）`);
  }
}
