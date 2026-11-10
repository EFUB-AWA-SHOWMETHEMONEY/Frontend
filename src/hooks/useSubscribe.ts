'use client';
import { useEffect, useRef } from 'react';
import useStomp from '@/hooks/useStomp';

// 특정 주소를 구독하는 훅

export default function useSubscribe<T>(destination: string, onMessage: (data: T) => void) {
  const { client, isConnected } = useStomp();

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!client || !isConnected) return;

    const subscription = client.subscribe(destination, (message) => {
      try {
        onMessageRef.current(JSON.parse(message.body) as T);
      } catch (error) {
        console.error('[STOMP] 메시지 처리 실패:', destination, error);
      }
    });

    return () => subscription.unsubscribe();
  }, [client, isConnected, destination]);
}
