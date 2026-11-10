'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useStore } from 'zustand';
import { CharacterBody, RemoteCharacter } from '@/components/plaza/PlazaCharacter';
import PlazaChat from '@/components/plaza/PlazaChat';
import PlazaToast from '@/components/plaza/PlazaToast';
import {
  BUILDING_SIGNS,
  PLAZA_BACKGROUND,
  PLAZA_IMAGE_DIR,
  PLAZA_OBJECTS,
} from '@/constants/plaza';
import { usePlayerMovement } from '@/hooks/usePlayerMovement';
import { usePlazaScale } from '@/hooks/usePlazaScale';
import { usePlazaSocket } from '@/hooks/usePlazaSocket';
import { memberStore } from '@/stores/memberStore';
import { plazaStore } from '@/stores/plazaStore';
import { PLAZA_HEIGHT, PLAZA_WIDTH } from '@/types/socket';
import { px } from '@/utils/plaza';

const WELCOME_DURATION_MS = 3000;

const BUILDING_LABELS = Object.fromEntries(
  PLAZA_OBJECTS.filter((o) => o.label).map((o) => [o.id, o.label!]),
);

export default function PlazaView() {
  const { viewportRef, scale } = usePlazaScale();
  const { playerRef, positionRef, pendingEntranceId } = usePlayerMovement();
  usePlazaSocket(positionRef);
  const nickname = useStore(memberStore, (state) => state.nickname);
  const participants = useStore(plazaStore, (state) => state.participants);
  const myMemberId = useStore(plazaStore, (state) => state.myMemberId);
  const others = useMemo(
    () =>
      myMemberId === null
        ? []
        : Object.values(participants).filter((p) => p.memberId !== myMemberId),
    [participants, myMemberId],
  );
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowWelcome(false), WELCOME_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const toastMessage = pendingEntranceId
    ? `${BUILDING_LABELS[pendingEntranceId]}은 준비 중이에요`
    : showWelcome
      ? `${nickname}님 안녕하세요. 오늘도 좋은 하루 되세요!`
      : null;

  return (
    <div ref={viewportRef} className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute top-1/2 left-1/2 -translate-1/2 font-jua [image-rendering:pixelated]"
        style={
          {
            '--s': scale,
            width: px(PLAZA_WIDTH),
            height: px(PLAZA_HEIGHT),
            visibility: scale ? 'visible' : 'hidden',
          } as CSSProperties
        }
      >
        <Image
          src={PLAZA_BACKGROUND}
          alt=""
          fill
          unoptimized
          priority
          draggable={false}
          className="pointer-events-none select-none"
        />

        {PLAZA_OBJECTS.map((object) => (
          <Image
            key={object.id}
            src={`${PLAZA_IMAGE_DIR}/${object.image}`}
            alt={object.label ?? ''}
            width={object.w}
            height={object.h}
            unoptimized
            draggable={false}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              left: px(object.x),
              top: px(object.y),
              width: px(object.w),
              height: px(object.h),
              zIndex: object.zY,
            }}
          />
        ))}

        {BUILDING_SIGNS.map((sign) => (
          <span
            key={sign.id}
            className="pointer-events-none absolute -translate-1/2 leading-none whitespace-nowrap select-none"
            style={{
              left: px(sign.x),
              top: px(sign.y),
              fontSize: px(sign.size),
              color: sign.color,
              zIndex: 1000,
            }}
          >
            {BUILDING_LABELS[sign.id]}
          </span>
        ))}

        <div
          ref={playerRef}
          className="pointer-events-none absolute"
          style={{
            left: 'calc(var(--x) * var(--s) * 1px)',
            top: 'calc(var(--y) * var(--s) * 1px)',
          }}
        >
          <CharacterBody nickname={nickname} isMe />
        </div>

        {others.map((participant) => (
          <RemoteCharacter key={participant.memberId} participant={participant} />
        ))}
      </div>

      {toastMessage && <PlazaToast message={toastMessage} />}
      <PlazaChat />
    </div>
  );
}
