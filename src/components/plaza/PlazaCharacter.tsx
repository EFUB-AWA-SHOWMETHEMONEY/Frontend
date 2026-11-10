import Image from 'next/image';
import { memo } from 'react';
import { PLAYER_SPRITE } from '@/constants/plaza';
import type { PlazaParticipant } from '@/types/socket';
import { px } from '@/utils/plaza';

interface CharacterBodyProps {
  nickname: string;
  isMe?: boolean;
}

export function CharacterBody({ nickname, isMe = false }: CharacterBodyProps) {
  return (
    <div className="absolute bottom-0 left-0 -translate-x-1/2">
      {!isMe && (
        <span
          className="absolute bottom-full left-1/2 mb-[calc(2px*var(--s))] -translate-x-1/2 rounded-full bg-brown-dark/80 px-[calc(3.5px*var(--s))] py-[calc(1px*var(--s))] leading-tight whitespace-nowrap text-white"
          style={{ fontSize: px(4) }}
        >
          {nickname}
        </span>
      )}
      <Image
        src="/assets/ui/avatar-tiger.svg"
        alt={isMe ? '내 캐릭터' : `${nickname} 캐릭터`}
        width={PLAYER_SPRITE.w}
        height={PLAYER_SPRITE.h}
        unoptimized
        draggable={false}
        className="block max-w-none"
        style={{ width: px(PLAYER_SPRITE.w), height: px(PLAYER_SPRITE.h) }}
      />
    </div>
  );
}

export const RemoteCharacter = memo(function RemoteCharacter({
  participant,
}: {
  participant: PlazaParticipant;
}) {
  return (
    <div
      className="pointer-events-none absolute transition-[left,top] duration-[120ms] ease-linear"
      style={{ left: px(participant.x), top: px(participant.y), zIndex: participant.y }}
    >
      <CharacterBody nickname={participant.nickname} />
    </div>
  );
});
