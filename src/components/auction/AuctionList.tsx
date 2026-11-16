'use client';

import Image from 'next/image';
import Link from 'next/link';
import Button, { buttonStyles } from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { AUCTION_PAGE_SIZE } from '@/constants/auction';
import type { AuctionSummary, AuctionType } from '@/types/auction';
import AuctionCard from './AuctionCard';

const filters = [
  { value: 'ALL', label: '전체' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVATE', label: 'Private' },
] as const;

export default function AuctionList({
  auctions,
  filter,
  page,
  notice,
  onFilterChange,
  onPageChange,
  onCreate,
  onEnter,
}: {
  auctions: readonly AuctionSummary[];
  filter: AuctionType | 'ALL';
  page: number;
  notice: { message: string; sequence: number } | null;
  onFilterChange: (filter: AuctionType | 'ALL') => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onEnter: (auctionId: string) => void;
}) {
  const filtered = auctions.filter((auction) => filter === 'ALL' || auction.type === filter);
  const totalPages = Math.ceil(filtered.length / AUCTION_PAGE_SIZE);
  const currentPage = totalPages === 0 ? 0 : Math.min(page, totalPages);
  const visible = filtered.slice(
    Math.max(0, currentPage - 1) * AUCTION_PAGE_SIZE,
    currentPage * AUCTION_PAGE_SIZE,
  );

  return (
    <div className="text-brown-dark [&_button:enabled:active]:brightness-90 [&_button:enabled:hover]:brightness-95 [&_button:focus-visible]:outline-3 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-brown-dark">
      <div className="absolute top-[176px] right-[70px] left-[63px] flex h-[61px] items-center justify-between [&_h1]:text-[40px] [&_h1]:leading-[49px] [&_h1]:text-black [&_h1]:[-webkit-text-stroke:16px_var(--color-ivory)] [&_h1]:[paint-order:stroke_fill]">
        <h1>경매장</h1>
        <Button onClick={onCreate}>
          <span aria-hidden="true" className="mr-3 text-4xl">
            ＋
          </span>
          경매 열기
        </Button>
      </div>
      <section
        className="absolute top-[284px] left-[50px] h-[659px] w-[1820px] rounded-[20px] bg-ivory px-20 pt-10 pb-8"
        aria-label="경매 목록"
      >
        <div
          className="mb-8 flex gap-3 [&_button:not(:first-child)]:w-[126px]"
          role="group"
          aria-label="경매 유형 필터"
        >
          {filters.map(({ value, label }) => (
            <Button
              key={value}
              size="tab"
              variant={filter === value ? 'selected' : 'secondary'}
              aria-pressed={filter === value}
              onClick={() => onFilterChange(value)}
            >
              {label}
            </Button>
          ))}
        </div>
        {filtered.length ? (
          <div className="flex gap-10">
            {visible.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} onEnter={onEnter} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={filter === 'ALL' ? '등록된 경매가 없습니다' : '해당 유형의 경매가 없습니다'}
            description={
              filter === 'ALL'
                ? '경매를 열어 첫 아이템을 등록해 보세요.'
                : '다른 경매 유형을 선택해 주세요.'
            }
            className="h-[441px] min-h-0! pt-12!"
          />
        )}
        {totalPages > 0 && (
          <nav aria-label="경매 목록 페이지">
            <button
              className={`absolute top-80 left-3.5 flex h-16 w-11 cursor-pointer items-center justify-center rounded-[10px] disabled:cursor-not-allowed disabled:opacity-25 [&_img]:rotate-180`}
              type="button"
              aria-label="이전 페이지"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <Image src="/assets/ui/arrow-right.png" alt="" width={24} height={30} />
            </button>
            <span
              className="absolute inset-x-0 bottom-5 text-center text-[28px] leading-[35px] text-brown-muted"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentPage} / {totalPages}
            </span>
            <button
              className={`absolute top-80 right-3.5 flex h-16 w-11 cursor-pointer items-center justify-center rounded-[10px] disabled:cursor-not-allowed disabled:opacity-25`}
              type="button"
              aria-label="다음 페이지"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <Image src="/assets/ui/arrow-right.png" alt="" width={24} height={30} />
            </button>
          </nav>
        )}
      </section>
      <div className="absolute top-[977px] left-[660px] w-[600px]">
        <Link
          href="/"
          className={`${buttonStyles({ variant: 'secondary', size: 'exit' })} hover:brightness-95 active:brightness-90`}
        >
          <span aria-hidden="true">←&nbsp;</span> 경매 나가기
        </Link>
      </div>
      <div
        className="absolute top-60 right-[70px] max-w-[1000px] text-[22px] not-empty:rounded-xl not-empty:border-2 not-empty:border-brown-dark not-empty:bg-ivory not-empty:px-4 not-empty:py-1"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {notice && <span key={notice.sequence}>{notice.message}</span>}
      </div>
    </div>
  );
}
