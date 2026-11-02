'use client';
import { Client } from '@stomp/stompjs';
import { createContext, useEffect, useState } from 'react';
import { getAccessToken } from '@/utils/token';

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
        console.error('[STOMP] 서버 에러:', frame.headers.message, frame.body);
        // TODO: 토큰 재발급 API가 생기면 여기서 재발급 후 재연결
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
