'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import { AUCTION_PAGE_SIZE } from '@/constants/auction';
import type { AuctionSummary, AuctionType } from '@/types/auction';
import AuctionCard from './AuctionCard';
import styles from './auction.module.css';

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
  const router = useRouter();
  const filtered = auctions.filter((auction) => filter === 'ALL' || auction.type === filter);
  const totalPages = Math.ceil(filtered.length / AUCTION_PAGE_SIZE);
  const currentPage = totalPages === 0 ? 0 : Math.min(page, totalPages);
  const visible = filtered.slice(
    Math.max(0, currentPage - 1) * AUCTION_PAGE_SIZE,
    currentPage * AUCTION_PAGE_SIZE,
  );

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1>경매장</h1>
        <Button onClick={onCreate}>
          <span aria-hidden="true" className={styles.plus}>
            ＋
          </span>
          경매 열기
        </Button>
      </div>
      <section className={styles.panel} aria-label="경매 목록">
        <div className={styles.filters} role="group" aria-label="경매 유형 필터">
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
          <div className={styles.cards}>
            {visible.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} onEnter={onEnter} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="진행 중인 경매가 없습니다"
            description="다른 경매 유형을 선택해 주세요."
            className="h-[441px] min-h-0! pt-12!"
          />
        )}
        <nav aria-label="경매 목록 페이지">
          <button
            className={`${styles.arrow} ${styles.previous}`}
            type="button"
            aria-label="이전 페이지"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <Image src="/assets/ui/arrow-right.png" alt="" width={24} height={30} />
          </button>
          <span className={styles.pageNumber} aria-live="polite" aria-atomic="true">
            {currentPage} / {totalPages}
          </span>
          <button
            className={`${styles.arrow} ${styles.next}`}
            type="button"
            aria-label="다음 페이지"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <Image src="/assets/ui/arrow-right.png" alt="" width={24} height={30} />
          </button>
        </nav>
      </section>
      <div className={styles.exit}>
        <Button variant="secondary" size="exit" onClick={() => router.push('/')}>
          <span aria-hidden="true">←&nbsp;</span> 경매 나가기
        </Button>
      </div>
      <div className={styles.notice} role="status" aria-live="polite" aria-atomic="true">
        {notice && <span key={notice.sequence}>{notice.message}</span>}
      </div>
    </div>
  );
}
