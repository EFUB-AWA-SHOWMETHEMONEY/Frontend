import type { AuctionType } from '../types/auction';
import type { MockAuction, MockAuctionBid, MockAuctionResult } from '../types/auctionMock';

/** Only accepted records participate. No settlement or arbitrary tie breaker. */
export function resolveAuctionResult(
  auction: MockAuction,
  bids: readonly MockAuctionBid[],
): MockAuctionResult {
  const eligible = bids.filter(
    (b) =>
      b.auctionId === auction.id &&
      Number.isSafeInteger(b.amount) &&
      b.amount >= auction.startingPrice &&
      Date.parse(b.submittedAt) < Date.parse(auction.endTime),
  );
  const effective =
    auction.type === 'PRIVATE' ? effectivePrivateBids(eligible, auction.id) : eligible;
  const base = { auctionId: auction.id, endedAt: auction.endTime };
  if (!effective.length) return { ...base, status: 'UNSOLD', winnerId: null, winningAmount: null };
  const highest = Math.max(...effective.map((b) => b.amount));
  const winners = effective.filter((b) => b.amount === highest);
  if (new Set(winners.map((b) => b.bidderId)).size > 1)
    return { ...base, status: 'PENDING_TIE', winnerId: null, winningAmount: null };
  return { ...base, status: 'SOLD', winnerId: winners[0].bidderId, winningAmount: highest };
}

/** Only the confirmed highest-price comparison, not complete bid validation. */
export function exceedsPublicHighestBid(amount: number, highestBid: number): boolean {
  return Number.isSafeInteger(amount) && amount > highestBid;
}

/** Call only AFTER accepting a valid bid, with both times on the same clock. */
export function endTimeAfterAcceptedBid(
  type: AuctionType,
  endTime: string,
  acceptedAt: string,
): string {
  const end = Date.parse(endTime);
  const submitted = Date.parse(acceptedAt);
  const remaining = end - submitted;
  // Bids at/after the deadline cannot revive an ended auction.
  if (type === 'PUBLIC' && remaining > 0 && remaining <= 10_000) {
    return new Date(submitted + 10_000).toISOString();
  }
  // Private: no extension (provisional policy).
  return endTime;
}

/** Latest accepted submission wins per bidder, even if its amount is lower.
 * Acceptance order also distinguishes submissions within the same millisecond.
 * This does NOT resolve equal prices between different bidders.
 */
export function effectivePrivateBids(
  bids: readonly MockAuctionBid[],
  auctionId: string,
): MockAuctionBid[] {
  const latest = new Map<string, MockAuctionBid>();
  for (const bid of bids) {
    if (bid.auctionId === auctionId) latest.set(bid.bidderId, bid);
  }
  return [...latest.values()];
}

export function minimumBidPolicy() {
  // TODO(MOAMOA-87): confirm increment. Starting-price equality is provisional in validateAuctionBid.
  return { status: 'UNRESOLVED' } as const;
}

export function tiedBidPolicy() {
  // TODO(MOAMOA-87): confirm equal-price winner selection; do not pick the first bidder.
  return { status: 'UNRESOLVED' } as const;
}

export function currencySettlementPolicy() {
  // TODO(MOAMOA-87): confirm debit/lock/refund timing. Never mutate memberStore here.
  return { status: 'UNRESOLVED' } as const;
}

export function itemTransferPolicy() {
  // TODO(MOAMOA-87): confirm ownership transfer and listing-time inventory restrictions.
  return { status: 'UNRESOLVED' } as const;
}
