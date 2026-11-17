import type { ApiResponse } from '@/types/api';
import type { PlazaSnapshot } from '@/types/socket';
import { getAccessToken } from '@/utils/token';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '');

export async function fetchPlazaSnapshot(signal?: AbortSignal): Promise<PlazaSnapshot> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}/api/plaza/participants`, {
    // 개발용 토큰은 한글일 수 있어서 인코딩
    headers: token ? { Authorization: `Bearer ${encodeURIComponent(token)}` } : {},
    signal,
  });
  const body = (await response.json()) as ApiResponse<PlazaSnapshot>;
  if (!response.ok || !body.success || !body.data) {
    throw new Error(body.message || '광장 참여자를 불러오지 못했어요.');
  }
  return body.data;
}
