// 웹소켓 연결에 사용할 액세스 토큰 가져오는 함수
export function getAccessToken(): string | null {
  // 임시 토큰은 개발 환경에서만 사용
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_DEV_TOKEN || null;
  }
  // TODO: 로그인 기능이 생기면 실제 토큰 저장소에서 꺼내도록 수정
  return null;
}
