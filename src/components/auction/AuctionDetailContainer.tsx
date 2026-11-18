'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { auctionStore } from '@/stores/auctionStore';
import { memberStore } from '@/stores/memberStore';
import { MOCK_AUCTION_MEMBER_ID } from '@/constants/auctionMock';
import { buttonStyles } from '@/components/common/Button';
import AuctionRoom from './AuctionRoom';
import AuctionRoomLoading from './AuctionRoomLoading';

const subscribe = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export default function AuctionDetailContainer({ auctionId }: { auctionId: string }) {
  // Memory store is synchronous. Wait for the browser snapshot before classifying IDs:
  // the server cannot know about auctions created during this client session.
  const ready = useSyncExternalStore(subscribe, clientReady, serverReady);
  // Subscribe only to this room's auction/bids/result; chat owns its message subscription.
  const auction = useStore(
    auctionStore,
    useShallow((state) => state.getRoomData(auctionId, MOCK_AUCTION_MEMBER_ID)?.auction),
  );
  const bids = useStore(
    auctionStore,
    useShallow((state) => state.getRoomData(auctionId, MOCK_AUCTION_MEMBER_ID)?.bids),
  );
  const result = useStore(
    auctionStore,
    (state) => state.getRoomData(auctionId, MOCK_AUCTION_MEMBER_ID)?.result,
  );
  const nickname = useStore(memberStore, (member) => member.nickname);
  if (!ready) return <AuctionRoomLoading />;
  if (!auction) {
    return (
      <section className="absolute top-[370px] left-[510px] w-[900px] rounded-[20px] border-[3px] border-brown-dark bg-ivory p-12 text-center">
        <h1 className="text-[36px]">경매방을 찾을 수 없어요</h1>
        <p className="mt-4 text-2xl text-brown-muted">
          주소를 확인해 주세요. 새로고침하면 직접 만든 경매는 초기화돼요.
        </p>
        <Link href="/auction" className={`${buttonStyles({ variant: 'secondary' })} mt-8`}>
          경매 목록으로
        </Link>
      </section>
    );
  }
  return (
    <AuctionRoom
      room={{ auction, bids: bids ?? [], messages: [], result: result ?? null }}
      viewerId={MOCK_AUCTION_MEMBER_ID}
      nickname={nickname}
    />
  );
}
