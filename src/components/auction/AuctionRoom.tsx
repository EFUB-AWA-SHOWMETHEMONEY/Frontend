'use client';

import { useEffect, useState } from 'react';
import { auctionStore } from '@/stores/auctionStore';
import { useAuctionClock } from '@/hooks/useAuctionClock';
import { bidWindowOpen } from '@/utils/auctionBid';
import AuctionBidModal from './AuctionBidModal';
import AuctionResultModal from './AuctionResultModal';
import { useAuctionLifecycle } from '@/hooks/useAuctionLifecycle';
import Image from 'next/image';
import Link from 'next/link';
import Button, { buttonStyles } from '@/components/common/Button';
import type { MockAuctionRoomData } from '@/types/auctionMock';
import AuctionItemPanel from './AuctionItemPanel';
import AuctionAuctioneer from './AuctionAuctioneer';
import AuctionRoomTimer from './AuctionRoomTimer';
import AuctionRoomChat from './AuctionRoomChat';

export default function AuctionRoom({
  room,
  viewerId,
  nickname,
}: {
  room: MockAuctionRoomData;
  viewerId: string;
  nickname: string;
}) {
  const [notice, setNotice] = useState(0);
  useAuctionLifecycle();
  const { auction } = room;
  const [bidOpen, setBidOpen] = useState(false);
  const now = useAuctionClock(auction.id);
  const canBid = bidWindowOpen(auction, now);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(0), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const isPrivate = auction.type === 'PRIVATE';
  const highestBidderName = auction.highestBidderId
    ? auction.highestBidderId === viewerId
      ? nickname
      : '참가자'
    : null;
  const ownBid = room.bids.findLast((bid) => bid.bidderId === viewerId);
  return (
    <section
      className="absolute inset-0 text-brown-dark"
      aria-label={`${isPrivate ? 'Private' : 'Public'} 경매방`}
    >
      {/* Negative z-index stays inside AuctionViewport's transform stacking context, below Header. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/assets/auction/room-scene.png')] bg-cover bg-center [image-rendering:pixelated]"
        aria-hidden="true"
      />
      <div className="absolute top-[157px] left-[70px] flex items-center gap-4 rounded-full bg-ivory/95 px-5 py-2 text-xl">
        <span>
          {isPrivate ? 'Private' : 'Public'} ·{' '}
          {auction.status === 'SCHEDULED'
            ? '경매 대기'
            : auction.status === 'ENDED'
              ? '경매 종료'
              : canBid
                ? '진행 중'
                : '입찰 마감'}
        </span>
        <span
          className="flex items-center gap-2"
          aria-label={`참가 인원 ${auction.participantCount}/${auction.participantCapacity}`}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="7" r="4" />
            <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
          </svg>
          {auction.participantCount}/{auction.participantCapacity}
        </span>
      </div>
      <AuctionItemPanel auction={auction} highestBidderName={highestBidderName} />
      <AuctionAuctioneer auction={auction} hasOwnBid={Boolean(ownBid)} />
      <AuctionRoomTimer auction={auction} now={now} />
      {process.env.NODE_ENV === 'development' && auction.status === 'SCHEDULED' && (
        <div className="absolute top-[420px] left-[1527px] w-[326px] rounded-2xl bg-ivory p-4 text-center">
          <p className="mb-3 text-xl">테스트용 · 시작 후 5분</p>
          <Button onClick={() => auctionStore.getState().startDemoAuction(auction.id)}>
            데모 경매 시작
          </Button>
        </div>
      )}
      {isPrivate ? (
        <section
          className="absolute top-[285px] left-[1527px] flex h-[66px] w-[326px] items-center justify-between rounded-[23px] border-[3px] border-brown-dark bg-ivory px-[37px]"
          aria-label="내 최신 입찰가"
        >
          <span className="text-xl text-brown-muted">내 입찰가</span>
          <span className="text-[28px]">{ownBid?.amount.toLocaleString('ko-KR') ?? '—'}</span>
        </section>
      ) : (
        <section
          className="absolute top-[285px] left-[1527px] h-[111px] w-[326px] rounded-[23px] border-[3px] border-brown-dark bg-ivory px-[37px] pt-[14px]"
          aria-label="최고 입찰자"
        >
          <p className="mb-[10px] text-xl leading-[25px] text-brown-muted">최고 입찰자</p>
          <div className="flex items-center gap-3 text-[28px] leading-[35px]">
            {highestBidderName && auction.highestBidderId === viewerId && (
              <Image src="/assets/ui/avatar-tiger.svg" alt="" width={48} height={48} />
            )}
            <span className="truncate" title={highestBidderName ?? undefined}>
              {highestBidderName ?? '아직 입찰 없음'}
            </span>
          </div>
        </section>
      )}
      <AuctionRoomChat
        key={auction.id}
        auctionId={auction.id}
        ended={auction.status === 'ENDED' || room.result !== null}
        blocked={bidOpen || room.result !== null}
      />
      <div className="absolute top-[976px] left-[1370px] flex gap-5 [&>a]:h-[66px] [&>a]:w-[180px] [&>button]:h-[66px] [&>button]:w-[280px] [&>button]:text-[28px]">
        <Link
          href="/auction"
          className={`${buttonStyles({ variant: 'secondary', size: 'exit' })} gap-3 hover:brightness-95`}
        >
          <span aria-hidden="true">←</span>나가기
        </Link>
        <Button
          variant="bank"
          disabled={!canBid}
          onClick={() => {
            setNotice(0);
            setBidOpen(true);
          }}
          aria-describedby={notice ? 'auction-bid-notice' : undefined}
        >
          입찰하기
        </Button>
      </div>
      <div
        id="auction-bid-notice"
        className="absolute top-[180px] left-[829px] w-[262px] text-center"
        role="status"
        aria-live="polite"
      >
        {notice > 0 && auction.status !== 'ENDED' && (
          <p
            key={notice}
            className="flex h-[55px] items-center justify-center rounded-full bg-ivory text-2xl"
          >
            입찰이 완료되었어요!
          </p>
        )}
      </div>
      {bidOpen && auction.status !== 'ENDED' && !room.result && (
        <AuctionBidModal
          auctionId={auction.id}
          bidderId={viewerId}
          now={now}
          onClose={() => setBidOpen(false)}
          onSuccess={() => {
            setBidOpen(false);
            setNotice((value) => value + 1);
          }}
        />
      )}
      {room.result && (
        <AuctionResultModal
          auction={auction}
          result={room.result}
          winnerName={room.result.winnerId === viewerId ? nickname : '참가자'}
        />
      )}
    </section>
  );
}
