import { authStore } from '@/stores/authStore';

export function getAccessToken(): string | null {
  const { accessToken } = authStore.getState();
  if (accessToken) return accessToken;
  // 임시 토큰은 개발 환경에서만 사용
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_DEV_TOKEN || null;
  }
  return null;
}
