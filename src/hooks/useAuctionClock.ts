'use client';

import { useEffect, useState } from 'react';
import { auctionStore } from '@/stores/auctionStore';

/** Display clock only. Never starts, ends, or extends an auction. */
export function useAuctionClock(auctionId: string) {
  const [now, setNow] = useState(
    () => auctionStore.getState().getAuctionNow(auctionId) ?? new Date(),
  );
  useEffect(() => {
    const tick = () => {
      const current = auctionStore.getState().getAuctionNow(auctionId);
      if (current) setNow(current);
    };
    const interval = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [auctionId]);
  return now;
}
