'use client';
import { useCallback, useContext } from 'react';
import { StompContext } from '@/components/StompProvider';

// STOMP 연결 상태와 발행 함수를 가져오는 훅

export default function useStomp() {
  const context = useContext(StompContext);
  if (!context) {
    throw new Error('useStomp는 StompProvider 안에서만 사용할 수 있어요.');
  }
  const { client, isConnected } = context;

  // 서버로 메시지 전송
  const publish = useCallback(
    (destination: string, body: unknown) => {
      if (!client || !isConnected) {
        console.warn('[STOMP] 아직 연결되지 않아 전송하지 못했어요:', destination);
        return false;
      }
      client.publish({ destination, body: JSON.stringify(body) });
      return true;
    },
    [client, isConnected],
  );

  return { client, isConnected, publish };
}
