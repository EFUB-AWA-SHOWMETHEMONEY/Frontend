// 공통 상수
export const PLAZA_WIDTH = 480;
export const PLAZA_HEIGHT = 270;

export const STOMP_DEST = {
  PLAZA_TOPIC: '/topic/plaza',
  PLAZA_MOVE: '/app/plaza/move',
  PLAZA_CHAT: '/app/plaza/chat',
  ERROR_QUEUE: '/user/queue/errors', // 에러 큐 경로 백엔드 확인 필요
} as const;

// 착용 아이템 정보 (임시)
export type Appearance = Record<string, string | null>;

// 광장에 있는 유저 정보
export interface PlazaParticipant {
  memberId: string;
  nickname: string;
  appearance: Appearance;
  x: number;
  y: number;
}

// /app/plaza/move
export interface MovePayload {
  x: number;
  y: number;
}

// /app/plaza/chat
export interface ChatPayload {
  text: string;
}

// /topic/plaza
export interface UserJoinedEvent extends PlazaParticipant {
  type: 'user_joined';
  ts: number;
}

export interface UserLeftEvent {
  type: 'user_left';
  memberId: string;
  ts: number;
}

export interface PositionUpdateEvent {
  type: 'position_update';
  memberId: string;
  x: number;
  y: number;
  ts: number;
}

export interface ChatMessageEvent {
  type: 'chat_message';
  memberId: string;
  nickname: string;
  text: string;
  ts: number;
}

export interface AuctionStartedEvent {
  type: 'auction_started';
  auctionId: string;
  itemName: string;
  ts: number;
}

// 이벤트 구분
export type PlazaEvent =
  UserJoinedEvent | UserLeftEvent | PositionUpdateEvent | ChatMessageEvent | AuctionStartedEvent;

// 입장 시 스냅샷 (응답 형식 백엔드 확인 필요)
export interface PlazaSnapshot {
  snapshotAt: number;
  participants: PlazaParticipant[];
}

// 에러 메세지 (백엔드 확인 필요)
export interface SocketError {
  code: string;
  message: string;
}
