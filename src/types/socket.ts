// 공통 상수
export const PLAZA_WIDTH = 480;
export const PLAZA_HEIGHT = 270;

export const STOMP_DEST = {
  PLAZA_TOPIC: '/topic/plaza',
  PLAZA_MOVE: '/app/plaza/move',
  PLAZA_CHAT: '/app/plaza/chat',
  ERROR_QUEUE: '/user/queue/errors', // 에러 큐 경로 백엔드 확인 필요
} as const;

// 착용 아이템 정보
export interface EquippedItem {
  itemId: number;
  itemImageUrl: string;
}

// 광장에 있는 유저 정보
export interface PlazaParticipant {
  memberId: number;
  nickname: string;
  equippedItem: EquippedItem | null;
  x: number;
  y: number;
}

// /app/plaza/move
export interface MovePayload {
  x: number;
  y: number;
  seq: number;
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
  memberId: number;
  ts: number;
}

export interface PositionUpdateEvent {
  type: 'position_update';
  memberId: number;
  x: number;
  y: number;
  seq: number;
  ts: number;
}

export interface ChatMessageEvent {
  type: 'chat_message';
  memberId: number;
  nickname: string;
  text: string;
  ts: number;
}

export interface EquipmentUpdateEvent {
  type: 'equipment_update';
  memberId: number;
  equippedItem: EquippedItem | null;
  ts: number;
}

// 이벤트 구분
export type PlazaEvent =
  UserJoinedEvent | UserLeftEvent | PositionUpdateEvent | ChatMessageEvent | EquipmentUpdateEvent;

// 입장 시 스냅샷
export interface PlazaSnapshot {
  snapshotAt: number;
  participantCount: number;
  participants: PlazaParticipant[];
}

// 에러 코드, 형식
export type SocketErrorCode =
  | 'INVALID_STOMP_AUTH_HEADER' // CONNECT에 Authorization 없음 / Bearer 아님
  | 'INVALID_AUTH_TOKEN' // 토큰 파싱 실패
  | 'EXPIRED_AUTH_TOKEN' // 토큰 만료
  | 'MEMBER_NOT_FOUND' // 입장 시 회원 없음
  | 'NOT_IN_ROOM' // 광장 입장 없이 이동 발행
  | 'BAD_REQUEST' // 페이로드 검증 실패
  | 'INTERNAL_SERVER_ERROR';

export interface SocketError {
  success: false;
  errorCode: SocketErrorCode;
  message: string;
  data: null;
}
