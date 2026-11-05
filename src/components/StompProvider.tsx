'use client';
import { Client } from '@stomp/stompjs';
import { createContext, useEffect, useState } from 'react';
import { getAccessToken } from '@/utils/token';
import type { SocketError } from '@/types/socket';

interface StompContextValue {
  client: Client | null;
  isConnected: boolean;
}

export const StompContext = createContext<StompContextValue | null>(null);

interface StompProviderProps {
  children: React.ReactNode;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'ws://localhost:4000/ws';

// 앱 전체에 STOMP 연결을 1개만 만들어 공유
export default function StompProvider({ children }: StompProviderProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const stompClient = new Client({
      brokerURL: SOCKET_URL,
      reconnectDelay: 3000,
      beforeConnect: () => {
        const token = getAccessToken();
        stompClient.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      },

      onConnect: () => setIsConnected(true),
      onWebSocketClose: () => setIsConnected(false),
      onStompError: (frame) => {
        let error: SocketError | null = null;
        try {
          error = JSON.parse(frame.body) as SocketError;
        } catch {
          // body가 JSON이 아니면 그대로 둠
        }
        console.error('[STOMP] 연결 거절:', error?.errorCode, error?.message);

        if (error?.errorCode === 'EXPIRED_AUTH_TOKEN') {
          // TODO: 토큰 재발급 API가 생기면 여기서 재발급
          return;
        }
        void stompClient.deactivate();
        // TODO: 로그인 기능이 생기면 로그인 페이지로 이동
      },
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      setIsConnected(false);
      setClient(null);
      void stompClient.deactivate();
    };
  }, []);

  return <StompContext.Provider value={{ client, isConnected }}>{children}</StompContext.Provider>;
}
