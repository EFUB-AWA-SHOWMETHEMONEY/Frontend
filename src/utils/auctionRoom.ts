import type { AuctionSummary } from '../types/auction';

/** Keep admission permission and the exact card ID at the navigation boundary. */
export function auctionEntryPath(auction: AuctionSummary | undefined): string | null {
  return auction?.canEnter ? `/auction/${encodeURIComponent(auction.id)}` : null;
}

/** Display only: never changes auction status or extends a deadline. */
export function auctionRemainingSeconds(endTime: string, now: Date): number {
  const milliseconds = Date.parse(endTime) - now.getTime();
  return Number.isFinite(milliseconds) ? Math.max(0, Math.ceil(milliseconds / 1000)) : 0;
}

export function formatAuctionRemaining(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
