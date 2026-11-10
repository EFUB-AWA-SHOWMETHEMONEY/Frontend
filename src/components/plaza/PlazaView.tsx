'use client';

import Image from 'next/image';
import { useMemo, type CSSProperties } from 'react';
import { useStore } from 'zustand';
import { CharacterBody, RemoteCharacter } from '@/components/plaza/PlazaCharacter';
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

  return (
    <div ref={viewportRef} className="mx-[50px] flex justify-center max-md:mx-4">
      <div
        className="relative overflow-hidden rounded-[20px] font-jua outline-[3px] outline-brown-dark [image-rendering:pixelated]"
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
            className="pointer-events-none absolute -translate-1/2 leading-none whitespace-nowrap text-brown-dark select-none"
            style={{
              left: px(sign.x),
              top: px(sign.y),
              fontSize: px(sign.size),
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

        {pendingEntranceId && (
          <p
            role="status"
            className="absolute top-[calc(8px*var(--s))] left-1/2 -translate-x-1/2 rounded-full border-2 border-brown-dark bg-ivory px-[calc(8px*var(--s))] py-[calc(2px*var(--s))] whitespace-nowrap text-brown-dark"
            style={{ fontSize: px(7), zIndex: 2000 }}
          >
            {BUILDING_LABELS[pendingEntranceId]}은 준비 중이에요
          </p>
        )}

        <p
          className="pointer-events-none absolute right-[calc(4px*var(--s))] bottom-[calc(3px*var(--s))] text-brown-dark/70"
          style={{ fontSize: px(5), zIndex: 2000 }}
        >
          방향키 / WASD로 이동
        </p>
      </div>
    </div>
  );
}
