'use client';

import { useEffect, type RefObject } from 'react';
import { fetchPlazaSnapshot } from '@/api/plaza';
import useStomp from '@/hooks/useStomp';
import { plazaStore } from '@/stores/plazaStore';
import { STOMP_DEST, type MovePayload, type PlazaEvent } from '@/types/socket';

const SEND_INTERVAL_MS = 110;
const RESEND_UNTIL_IDENTIFIED_MS = 500;
const SNAPSHOT_RETRY_BASE_MS = 1000;
const SNAPSHOT_RETRY_MAX_MS = 10000;
const RESYNC_COOLDOWN_MS = 3000;
const BUFFER_LIMIT = 1000;

export function usePlazaSocket(positionRef: RefObject<{ x: number; y: number }>) {
  const { client, isConnected } = useStomp();

  useEffect(() => {
    if (!client || !isConnected) return;
    const store = plazaStore.getState();
    const abort = new AbortController();
    let seq = 0;
    let lastSent: { x: number; y: number } | null = null;
    let lastSentAt = 0;
    let myMemberId: number | null = null;
    // 서버가 내 memberId를 알려주지 않아서, 내가 보낸 이동이 돌아올 때 알아냄
    const sentMoves = new Map<number, { x: number; y: number }>();
    // 스냅샷을 받기 전까지는 이벤트를 모아뒀다가 스냅샷 이후 것만 적용
    let syncing = false;
    let synced = false;
    let lastSyncAt = 0;
    let retryCount = 0;
    let retryTimer: number | undefined;
    const buffered: PlazaEvent[] = [];

    const identify = (event: PlazaEvent) => {
      if (myMemberId !== null || event.type !== 'position_update') return;
      const sent = sentMoves.get(event.seq);
      if (!sent || sent.x !== event.x || sent.y !== event.y) return;
      myMemberId = event.memberId;
      sentMoves.clear();
      store.setMyMemberId(event.memberId);
    };

    const syncSnapshot = () => {
      if (syncing || abort.signal.aborted) return;
      syncing = true;
      synced = false;
      lastSyncAt = Date.now();
      fetchPlazaSnapshot(abort.signal)
        .then((snapshot) => {
          if (abort.signal.aborted) return;
          retryCount = 0;
          store.setParticipants(snapshot.participants);
          buffered.filter((e) => e.ts > snapshot.snapshotAt).forEach(store.applyEvent);
          buffered.length = 0;
          synced = true;
        })
        .catch((error: unknown) => {
          if (abort.signal.aborted) return;
          console.error('[광장] 스냅샷 조회 실패:', error);
          const delay = Math.min(SNAPSHOT_RETRY_BASE_MS * 2 ** retryCount, SNAPSHOT_RETRY_MAX_MS);
          retryCount += 1;
          retryTimer = window.setTimeout(syncSnapshot, delay);
        })
        .finally(() => {
          syncing = false;
        });
    };

    const isUnknownMember = (event: PlazaEvent) =>
      (event.type === 'position_update' || event.type === 'equipment_update') &&
      event.memberId !== myMemberId &&
      !(event.memberId in plazaStore.getState().participants);

    const subscription = client.subscribe(STOMP_DEST.PLAZA_TOPIC, (message) => {
      let event: PlazaEvent;
      try {
        event = JSON.parse(message.body) as PlazaEvent;
      } catch {
        return;
      }
      identify(event);
      if (event.type === 'chat_message') {
        store.applyEvent(event);
        return;
      }
      // 모르는 참가자의 이벤트가 오면 목록이 어긋난 것이라 스냅샷을 다시 받음
      if (synced && isUnknownMember(event) && Date.now() - lastSyncAt >= RESYNC_COOLDOWN_MS) {
        syncSnapshot();
      }
      if (synced) {
        store.applyEvent(event);
        return;
      }
      buffered.push(event);
      if (buffered.length > BUFFER_LIMIT) buffered.shift();
    });

    syncSnapshot();

    const sendPosition = () => {
      const x = Math.round(positionRef.current.x);
      const y = Math.round(positionRef.current.y);
      const now = Date.now();
      const unchanged = lastSent?.x === x && lastSent?.y === y;
      if (unchanged && (myMemberId !== null || now - lastSentAt < RESEND_UNTIL_IDENTIFIED_MS)) {
        return;
      }
      seq += 1;
      const payload: MovePayload = { x, y, seq };
      client.publish({ destination: STOMP_DEST.PLAZA_MOVE, body: JSON.stringify(payload) });
      if (myMemberId === null) sentMoves.set(seq, { x, y });
      lastSent = { x, y };
      lastSentAt = now;
    };
    sendPosition();
    const timer = window.setInterval(sendPosition, SEND_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(retryTimer);
      abort.abort();
      store.reset();
      try {
        subscription.unsubscribe();
      } catch {
        return;
      }
    };
  }, [client, isConnected, positionRef]);
}
