'use client';

import { useState } from 'react';
import { useAuctionLifecycle } from '@/hooks/useAuctionLifecycle';
import { useRouter } from 'next/navigation';
import { useStore } from 'zustand';
import { auctionStore } from '@/stores/auctionStore';
import { memberStore } from '@/stores/memberStore';
import { auctionEntryPath } from '@/utils/auctionRoom';
import type { AuctionType, CreateAuctionInput } from '@/types/auction';
import AuctionList from './AuctionList';
import AuctionCreateModal from './AuctionCreateModal';

export default function AuctionContainer() {
  useAuctionLifecycle();
  const router = useRouter();
  const auctions = useStore(auctionStore, (state) => state.auctions);
  const [filter, setFilter] = useState<AuctionType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<{ message: string; sequence: number } | null>(null);

  function announce(message: string) {
    setNotice((previous) => ({ message, sequence: (previous?.sequence ?? 0) + 1 }));
  }

  function create(input: CreateAuctionInput): string | null {
    const result = auctionStore.getState().createAuction(input, memberStore.getState(), new Date());
    if (!result.ok) return result.error;
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
          setCreateOpen(true);
        }}
        onEnter={(id) => {
          const auction = auctionStore.getState().getAuction(id);
          const path = auctionEntryPath(auction);
          if (path) router.push(path);
        }}
      />
      {isCreateOpen && (
        <AuctionCreateModal onClose={() => setCreateOpen(false)} onCreate={create} />
      )}
    </>
  );
}
