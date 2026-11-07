import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import type { ApiResponse } from '../src/types/api';
import {
  PLAZA_HEIGHT,
  PLAZA_WIDTH,
  STOMP_DEST,
  type ChatPayload,
  type MovePayload,
  type PlazaEvent,
  type PlazaParticipant,
  type PlazaSnapshot,
  type SocketError,
} from '../src/types/socket';

const PORT = 4000;
const MOVE_INTERVAL_MS = 100;
const CHAT_INTERVAL_MS = 1000;
const CHAT_MAX_LENGTH = 100;

// STOMP 프레임 읽기/쓰기
interface Frame {
  command: string;
  headers: Record<string, string>;
  body: string;
}

function parseFrames(raw: string): Frame[] {
  return raw
    .split('\0')
    .map((chunk) => chunk.replace(/^(\r?\n)+/, ''))
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const sep = /\r?\n\r?\n/.exec(chunk);
      const head = sep ? chunk.slice(0, sep.index) : chunk;
      const body = sep ? chunk.slice(sep.index + sep[0].length) : '';
      const [command, ...headerLines] = head.split(/\r?\n/);
      const headers: Record<string, string> = {};
      for (const line of headerLines) {
        const idx = line.indexOf(':');
        if (idx > 0) headers[line.slice(0, idx)] = line.slice(idx + 1);
      }
      return { command: command.trim(), headers, body };
    });
}

function buildFrame(command: string, headers: Record<string, string>, body = ''): string {
  const headerText = Object.entries(headers)
    .map(([k, v]) => `${k}:${v}`)
    .join('\n');
  return `${command}\n${headerText}\n\n${body}\0`;
}

// 접속한 클라이언트 관리

interface Client {
  ws: WebSocket;
  authenticated: boolean; // CONNECT 인증을 통과 여부
  memberId: number;
  nickname: string;
  subscriptions: Map<string, string>;
  inPlaza: boolean;
  lastMoveAt: number;
  lastChatAt: number;
}

const clients = new Set<Client>();

// 광장에 있는 유저
const participants = new Map<number, PlazaParticipant>();

const moveSeqs = new Map<number, number>();
function nextSeq(memberId: number) {
  const seq = (moveSeqs.get(memberId) ?? 0) + 1;
  moveSeqs.set(memberId, seq);
  return seq;
}

const memberIds = new Map<string, number>();
let nextMemberId = 1001; // 봇 1-3, 유저 1001-

let messageSeq = 0;

// 특정 클라이언트가 구독한 주소로 메세지 전송
function sendTo(client: Client, destination: string, payload: unknown) {
  for (const [subId, dest] of client.subscriptions) {
    if (dest !== destination) continue;
    client.ws.send(
      buildFrame(
        'MESSAGE',
        {
          destination,
          subscription: subId,
          'message-id': String(messageSeq++),
          'content-type': 'application/json',
        },
        JSON.stringify(payload),
      ),
    );
  }
}

// /topic/plaza 브로드캐스트
function broadcastPlaza(payload: PlazaEvent) {
  for (const client of clients) sendTo(client, STOMP_DEST.PLAZA_TOPIC, payload);
  console.log('[BROADCAST]', payload.type, JSON.stringify(payload));
}

function makeError(errorCode: SocketError['errorCode'], message: string): SocketError {
  return { success: false, errorCode, message, data: null };
}

function sendError(client: Client, errorCode: SocketError['errorCode'], message: string) {
  sendTo(client, STOMP_DEST.ERROR_QUEUE, makeError(errorCode, message));
}

// 메세지 처리 규칙
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function isInt(value: unknown): value is number {
  return Number.isInteger(value);
}

function parseJsonObject(body: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function handleMove(client: Client, body: string) {
  const now = Date.now();
  if (now - client.lastMoveAt < MOVE_INTERVAL_MS) return;
  const payload = parseJsonObject(body);
  if (!payload) {
    sendError(client, 'BAD_REQUEST', '요청 본문은 JSON 객체여야 해요.');
    return;
  }
  const { x, y, seq } = payload as Partial<MovePayload>;
  if (!isInt(x) || !isInt(y) || !isInt(seq)) {
    sendError(client, 'BAD_REQUEST', 'x, y, seq는 정수로 보내야 해요.');
    return;
  }
  if (!client.inPlaza) {
    sendError(client, 'NOT_IN_ROOM', '광장에 존재하지 않는 회원입니다.');
    return;
  }

  if (seq <= (moveSeqs.get(client.memberId) ?? 0)) return;

  const me = participants.get(client.memberId);
  if (!me) return;

  client.lastMoveAt = now;
  moveSeqs.set(client.memberId, seq);
  me.x = clamp(x, 0, PLAZA_WIDTH - 1);
  me.y = clamp(y, 0, PLAZA_HEIGHT - 1);
  broadcastPlaza({
    type: 'position_update',
    memberId: client.memberId,
    x: me.x,
    y: me.y,
    seq,
    ts: now,
  });
}

function handleChat(client: Client, body: string) {
  const now = Date.now();
  const payload = parseJsonObject(body);
  if (!payload) {
    sendError(client, 'BAD_REQUEST', '요청 본문은 JSON 객체여야 해요.');
    return;
  }
  const { text } = payload as Partial<ChatPayload>;

  // 누락,공백,100자 초과 → BAD_REQUEST
  if (typeof text !== 'string' || text.trim() === '') {
    sendError(client, 'BAD_REQUEST', '채팅 내용을 입력해주세요.');
    return;
  }
  const trimmed = text.trim(); // 공백 제거 후 브로드캐스트
  if (trimmed.length > CHAT_MAX_LENGTH) {
    sendError(client, 'BAD_REQUEST', `채팅은 ${CHAT_MAX_LENGTH}자까지 가능해요.`);
    return;
  }
  if (!client.inPlaza) {
    sendError(client, 'NOT_IN_ROOM', '광장에 존재하지 않는 회원입니다.');
    return;
  }
  if (now - client.lastChatAt < CHAT_INTERVAL_MS) return;
  client.lastChatAt = now;
  broadcastPlaza({
    type: 'chat_message',
    memberId: client.memberId,
    nickname: client.nickname,
    text: trimmed.replace(/바보/g, (word) => '*'.repeat(word.length)), // 금지어 마스킹 흉내
    ts: now,
  });
}

// memberId별 연결 수
const plazaConnections = new Map<number, number>();

// 구독 시작 시 광장 입장 처리
function joinPlaza(client: Client) {
  if (client.inPlaza) return;
  client.inPlaza = true;
  const count = plazaConnections.get(client.memberId) ?? 0;
  plazaConnections.set(client.memberId, count + 1);
  if (count > 0) return; // 이미 다른 탭으로 입장해 있으면 위치 유지, 입장 알림 생략

  const me: PlazaParticipant = {
    memberId: client.memberId,
    nickname: client.nickname,
    equippedItem: null,
    x: PLAZA_WIDTH / 2,
    y: PLAZA_HEIGHT / 2,
  };
  participants.set(me.memberId, me);
  broadcastPlaza({ type: 'user_joined', ...me, ts: Date.now() });
}

function leavePlaza(client: Client) {
  if (!client.inPlaza) return;
  client.inPlaza = false;
  const count = (plazaConnections.get(client.memberId) ?? 1) - 1;
  if (count > 0) {
    plazaConnections.set(client.memberId, count);
    return; // 다른 탭이 남아 있으면 광장에 그대로 둠
  }

  plazaConnections.delete(client.memberId);
  participants.delete(client.memberId);
  moveSeqs.delete(client.memberId);
  broadcastPlaza({ type: 'user_left', memberId: client.memberId, ts: Date.now() });
}

// 구독 목록이 바뀔 때마다 호출: 광장 구독이 하나라도 있으면 입장, 하나도 없으면 퇴장
function syncPlazaPresence(client: Client) {
  const hasPlazaSub = [...client.subscriptions.values()].includes(STOMP_DEST.PLAZA_TOPIC);
  if (hasPlazaSub) joinPlaza(client);
  else leavePlaza(client);
}

// CONNECT 인증 실패: ERROR 프레임을 보내고 연결 종료
function rejectConnect(client: Client, errorCode: SocketError['errorCode'], message: string) {
  const error = makeError(errorCode, message);
  client.ws.send(
    buildFrame(
      'ERROR',
      { message: error.errorCode, 'content-type': 'application/json' },
      JSON.stringify(error),
    ),
  );
  client.ws.close();
}

// STOMP 명령 처리
function handleFrame(client: Client, frame: Frame) {
  const isConnectFrame = frame.command === 'CONNECT' || frame.command === 'STOMP';
  if (!client.authenticated && !isConnectFrame) {
    rejectConnect(client, 'INVALID_STOMP_AUTH_HEADER', 'CONNECT 인증 후에 요청해주세요.');
    return;
  }

  switch (frame.command) {
    case 'CONNECT':
    case 'STOMP': {
      // 현재 목업: "Bearer ~"만 있으면 통과
      const auth = frame.headers['Authorization'] ?? frame.headers['authorization'];
      const token = auth?.replace(/^Bearer\s+/, '').trim();
      if (!auth?.startsWith('Bearer ') || !token) {
        rejectConnect(client, 'INVALID_STOMP_AUTH_HEADER', 'STOMP 인증 헤더가 필요합니다.');
        return;
      }
      try {
        client.nickname = decodeURIComponent(token);
      } catch {
        rejectConnect(client, 'INVALID_AUTH_TOKEN', '유효하지 않은 인증 토큰입니다.');
        return;
      }
      if (!memberIds.has(client.nickname)) memberIds.set(client.nickname, nextMemberId++);
      client.memberId = memberIds.get(client.nickname)!;
      client.authenticated = true;
      client.ws.send(buildFrame('CONNECTED', { version: '1.2', 'heart-beat': '0,0' }));
      console.log(`연결: ${client.nickname}`);
      return;
    }

    case 'SUBSCRIBE': {
      const { id, destination } = frame.headers;
      client.subscriptions.set(id, destination);
      syncPlazaPresence(client);
      return;
    }

    case 'UNSUBSCRIBE': {
      client.subscriptions.delete(frame.headers.id);
      syncPlazaPresence(client);
      return;
    }

    case 'SEND': {
      const dest = frame.headers.destination;
      try {
        if (dest === STOMP_DEST.PLAZA_MOVE) handleMove(client, frame.body);
        else if (dest === STOMP_DEST.PLAZA_CHAT) handleChat(client, frame.body);
      } catch (error) {
        // 여기 오는 건 예상하지 못한 내부 오류
        console.error(`[SEND 처리 오류] ${dest}`, error);
        sendError(client, 'INTERNAL_SERVER_ERROR', '요청 처리 중 오류가 발생했어요.');
      }
      return;
    }

    case 'DISCONNECT': {
      if (frame.headers.receipt) {
        client.ws.send(buildFrame('RECEIPT', { 'receipt-id': frame.headers.receipt }));
      }
      return;
    }
  }
}

// 가짜 유저
interface Bot extends PlazaParticipant {
  targetX: number;
  targetY: number;
}

const randomPos = () => ({
  x: Math.round(40 + Math.random() * (PLAZA_WIDTH - 80)),
  y: Math.round(40 + Math.random() * (PLAZA_HEIGHT - 80)),
});

const bots: Bot[] = ['모아', '아모', '모모'].map((nickname, i) => {
  const pos = randomPos();
  const target = randomPos();
  return {
    memberId: i + 1,
    nickname,
    equippedItem: null,
    ...pos,
    targetX: target.x,
    targetY: target.y,
  };
});

for (const bot of bots) {
  const { targetX, targetY, ...participant } = bot;
  participants.set(bot.memberId, participant);
}

setInterval(() => {
  for (const bot of bots) {
    const dx = bot.targetX - bot.x;
    const dy = bot.targetY - bot.y;
    if (dx === 0 && dy === 0) {
      const next = randomPos();
      bot.targetX = next.x;
      bot.targetY = next.y;
      continue;
    }
    bot.x += Math.sign(dx);
    bot.y += Math.sign(dy);
    const p = participants.get(bot.memberId)!;
    p.x = bot.x;
    p.y = bot.y;
    const event: PlazaEvent = {
      type: 'position_update',
      memberId: bot.memberId,
      x: bot.x,
      y: bot.y,
      seq: nextSeq(bot.memberId),
      ts: Date.now(),
    };
    for (const client of clients) sendTo(client, STOMP_DEST.PLAZA_TOPIC, event);
  }
}, MOVE_INTERVAL_MS);

const BOT_LINES = [
  '안녕하세요!',
  '오늘 퀴즈 풀었어요?',
  '경매 언제 시작해요?',
  '개발 파이팅',
  '쇼미더머니 파이팅',
];

// 8초마다 랜덤 봇이 채팅
setInterval(() => {
  const bot = bots[Math.floor(Math.random() * bots.length)];
  broadcastPlaza({
    type: 'chat_message',
    memberId: bot.memberId,
    nickname: bot.nickname,
    text: BOT_LINES[Math.floor(Math.random() * BOT_LINES.length)],
    ts: Date.now(),
  });
}, 8000);

// 서버 실행
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();

  const sendJson = (status: number, body: ApiResponse<unknown>) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (req.method === 'GET' && req.url === '/api/plaza/participants') {
    // 목업: Bearer ~ 만 있으면 통과
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      return sendJson(401, { success: false, data: null, message: '로그인이 필요합니다.' });
    }
    const list = [...participants.values()];
    const snapshot: PlazaSnapshot = {
      snapshotAt: Date.now(),
      participantCount: list.length,
      participants: list,
    };
    return sendJson(200, {
      success: true,
      data: snapshot,
      message: '광장 참여자 조회 요청이 성공했습니다.',
    });
  }
  res.writeHead(404).end();
});

const wss = new WebSocketServer({
  server,
  path: '/ws',
  handleProtocols: (protocols) => [...protocols][0] ?? false,
});

wss.on('connection', (ws) => {
  const client: Client = {
    ws,
    authenticated: false,
    memberId: 0,
    nickname: '',
    subscriptions: new Map(),
    inPlaza: false,
    lastMoveAt: 0,
    lastChatAt: 0,
  };
  clients.add(client);

  ws.on('message', (data) => {
    for (const frame of parseFrames(data.toString())) {
      if (ws.readyState !== WebSocket.OPEN) break;
      handleFrame(client, frame);
    }
  });

  ws.on('error', (error) => {
    console.error(`연결 오류: ${client.nickname || '(미인증)'}`, error.message);
  });

  ws.on('close', () => {
    leavePlaza(client);
    clients.delete(client);
    if (client.nickname) console.log(`연결 종료: ${client.nickname}`);
  });
});

server.listen(PORT, () => {
  console.log(`목업 서버 실행 중`);
  console.log(`웹소켓: ws://localhost:${PORT}/ws`);
  console.log(`스냅샷: http://localhost:${PORT}/api/plaza/participants`);
});
