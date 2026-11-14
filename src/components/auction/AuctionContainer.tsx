'use client';

import { useRef, useState } from 'react';
import { auctionFixtures } from '@/constants/auction';
import { memberStore } from '@/stores/memberStore';
import { createMockAuction } from '@/utils/auction';
import type { AuctionSummary, AuctionType, CreateAuctionInput } from '@/types/auction';
import AuctionList from './AuctionList';
import AuctionCreateModal from './AuctionCreateModal';

export default function AuctionContainer() {
  const [auctions, setAuctions] = useState<readonly AuctionSummary[]>(auctionFixtures);
  const [filter, setFilter] = useState<AuctionType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<{ message: string; sequence: number } | null>(null);
  const submitted = useRef(false);

  function announce(message: string) {
    setNotice((previous) => ({ message, sequence: (previous?.sequence ?? 0) + 1 }));
  }

  function create(input: CreateAuctionInput): string | null {
    if (submitted.current) return '이미 생성 중입니다.';
    const result = createMockAuction(
      input,
      memberStore.getState(),
      new Date(),
      () => `auction-${crypto.randomUUID()}`,
    );
    if (!result.ok) return result.error;
    submitted.current = true;
    setAuctions((previous) => [result.auction, ...previous]);
    setFilter('ALL');
    setPage(1);
    setCreateOpen(false);
    announce(`${result.auction.itemName} 경매가 생성되었습니다.`);
    return null;
  }

  return (
    <>
      <AuctionList
        auctions={auctions}
        filter={filter}
        page={page}
        notice={notice}
        onFilterChange={(next) => {
          setFilter(next);
          setPage(1);
          setNotice(null);
        }}
        onPageChange={setPage}
        onCreate={() => {
          submitted.current = false;
          setCreateOpen(true);
        }}
        onEnter={(id) => {
          const auction = auctions.find((entry) => entry.id === id);
          if (auction?.canEnter) announce(`${auction.itemName} 경매 상세방은 준비 중입니다.`);
        }}
      />
      {isCreateOpen && (
        <AuctionCreateModal onClose={() => setCreateOpen(false)} onCreate={create} />
      )}
    </>
  );
}
