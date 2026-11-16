'use client';

import type { ReactNode } from 'react';
import { AUCTION_DESIGN_WIDTH, AUCTION_DESIGN_HEIGHT } from '@/constants/auction';
import { useScaledViewport } from '@/hooks/useScaledViewport';

export default function AuctionViewport({ children }: { children: ReactNode }) {
  const { viewportRef, contentRef } = useScaledViewport({
    width: AUCTION_DESIGN_WIDTH,
    height: AUCTION_DESIGN_HEIGHT,
    lockScroll: true,
  });
  return (
    <div ref={viewportRef} className="fixed inset-0 overflow-hidden bg-[#292134]">
      <div
        ref={contentRef}
        className="invisible absolute top-0 left-1/2 h-[1080px] w-[1920px] origin-top bg-[linear-gradient(#0000004d,#0000004d),url('/assets/backgrounds/auction-bg.webp')] bg-cover bg-center font-jua [&>header]:absolute [&>header]:top-10 [&>header]:left-[50px] [&>header]:m-0 [&>header]:h-[88px] [&>header]:w-[1820px] [&>header]:grid-cols-[minmax(0,1fr)_166px_minmax(0,1fr)] [&>header]:gap-y-0 [&>header]:px-[47px] [&>header]:py-0 [&>header>div]:col-auto [&>header>div]:row-auto [&>header>img]:col-auto [&>header>img]:row-auto"
      >
        {children}
      </div>
    </div>
  );
}
