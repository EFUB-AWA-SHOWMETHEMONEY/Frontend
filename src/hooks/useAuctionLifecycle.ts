'use client';
import { useEffect } from 'react';
import { auctionStore } from '@/stores/auctionStore';

/** Catch up by absolute deadlines, including after suspended/background tabs. */
export function useAuctionLifecycle() {
  useEffect(() => {
    const check = () => auctionStore.getState().finishExpiredAuctions();
    check();
    const interval = window.setInterval(check, 250);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
}
