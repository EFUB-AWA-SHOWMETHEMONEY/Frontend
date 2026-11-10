'use client';

import { useEffect, type RefObject } from 'react';
import { fetchPlazaSnapshot } from '@/api/plaza';
import useStomp from '@/hooks/useStomp';
import { plazaStore } from '@/stores/plazaStore';
import { STOMP_DEST, type MovePayload, type PlazaEvent } from '@/types/socket';

const SEND_INTERVAL_MS = 110;
const RESEND_UNTIL_IDENTIFIED_MS = 500;

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
    // 서버가 내 memberId를 알려주지 않아서, 내가 보낸 이동이 돌아올 때 알아낸다
    const sentMoves = new Map<number, { x: number; y: number }>();
    let snapshotAt: number | null = null;
    const buffered: PlazaEvent[] = [];

    const identify = (event: PlazaEvent) => {
      if (myMemberId !== null || event.type !== 'position_update') return;
      const sent = sentMoves.get(event.seq);
      if (!sent || sent.x !== event.x || sent.y !== event.y) return;
      myMemberId = event.memberId;
      sentMoves.clear();
      store.setMyMemberId(event.memberId);
    };

    const subscription = client.subscribe(STOMP_DEST.PLAZA_TOPIC, (message) => {
      let event: PlazaEvent;
      try {
        event = JSON.parse(message.body) as PlazaEvent;
      } catch {
        return;
      }
      identify(event);
      if (snapshotAt === null && event.type !== 'chat_message') buffered.push(event);
      else store.applyEvent(event);
    });

    fetchPlazaSnapshot(abort.signal)
      .then((snapshot) => {
        store.setParticipants(snapshot.participants);
        snapshotAt = snapshot.snapshotAt;
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        console.error('[광장] 스냅샷 조회 실패:', error);
        snapshotAt = 0;
      })
      .finally(() => {
        if (abort.signal.aborted) return;
        buffered.filter((e) => e.ts > (snapshotAt ?? 0)).forEach(store.applyEvent);
        buffered.length = 0;
      });

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
