'use client';

import type { MockAuction } from '@/types/auctionMock';
import { auctionRemainingSeconds, formatAuctionRemaining } from '@/utils/auctionRoom';

export default function AuctionRoomTimer({ auction, now }: { auction: MockAuction; now: Date }) {
  const duration = Math.max(
    1,
    (Date.parse(auction.endTime) - Date.parse(auction.startedAt ?? auction.scheduledStartTime)) /
      1000,
  );
  const seconds =
    auction.status === 'SCHEDULED'
      ? duration
      : auction.status === 'ENDED'
        ? 0
        : Math.min(duration, auctionRemainingSeconds(auction.endTime, now));
  const percent = Math.max(0, Math.min(100, (seconds / duration) * 100));
  return (
    <section
      className="absolute top-[173px] left-[1527px] h-[98px] w-[326px] rounded-[23px] border-[3px] border-brown-dark bg-ivory px-[37px] pt-[13px]"
      aria-label="경매 남은 시간"
    >
      <div className="flex items-center justify-between">
        <span className="text-xl text-brown-muted">
          {auction.status === 'SCHEDULED' ? '진행 예정 시간' : '남은 시간'}
        </span>
        <span className="text-[32px] leading-10 tabular-nums" role="timer">
          {formatAuctionRemaining(seconds)}
        </span>
      </div>
      <div
        className="mt-1 h-4 overflow-hidden rounded-full border-2 border-black bg-cream"
        role="progressbar"
        aria-label="남은 시간 비율"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div className="h-full rounded-full bg-brown-dark" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
