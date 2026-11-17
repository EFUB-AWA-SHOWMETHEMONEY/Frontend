import type { AuctionSummary } from './auction';

/** Client-only demo domain models, NOT backend request/response DTOs. */
export interface MockAuction extends AuctionSummary {
  sellerId: string;
  highestBid: number | null;
  highestBidderId: string | null;
  /** Same value as startTime; startTime remains the list's compatibility field. */
  scheduledStartTime: string;
  /** Actual mock start; separate from the originally scheduled list time. */
  startedAt?: string;
  endTime: string;
  version: number;
  /** Fixture timestamps use a session-relative demo clock; created auctions use wall time. */
  timeBasis: 'DEMO' | 'REAL';
}

export interface MockAuctionBid {
  bidId: string;
  auctionId: string;
  bidderId: string;
  amount: number;
  /** Timestamp in the auction's time basis. History is kept in acceptance order. */
  submittedAt: string;
}

export interface MockBidInput {
  auctionId: string;
  bidderId: string;
  requestId: string;
  value: string;
}

export interface BidMemberSnapshot {
  hydrated: boolean;
  balance: number;
}

export type BidFailureCode =
  | 'NOT_FOUND'
  | 'NOT_READY'
  | 'NOT_RUNNING'
  | 'EXPIRED'
  | 'EMPTY'
  | 'INVALID'
  | 'STARTING_PRICE'
  | 'HIGHEST_PRICE'
  | 'BALANCE'
  | 'DUPLICATE'
  | 'INVALID_REQUEST';
export type BidFailure = { ok: false; code: BidFailureCode; message: string };
export type BidSubmission = { ok: true; bid: MockAuctionBid } | BidFailure;

export interface MockAuctionMessage {
  messageId: string;
  auctionId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface MockChatInput {
  auctionId: string;
  senderId: string;
  senderName: string;
  content: string;
  requestId: string;
}
export type ChatSubmission =
  { ok: true; message: MockAuctionMessage } | { ok: false; error: string };

export type MockAuctionResult = {
  auctionId: string;
  endedAt: string;
} & (
  | { status: 'SOLD'; winnerId: string; winningAmount: number }
  | { status: 'UNSOLD'; winnerId: null; winningAmount: null }
  | { status: 'PENDING_TIE'; winnerId: null; winningAmount: null }
);

/** A room view must not receive opponents' Private bids or their aggregate highest bid. */
export interface MockAuctionRoomData {
  auction: MockAuction;
  bids: readonly MockAuctionBid[];
  messages: readonly MockAuctionMessage[];
  result: MockAuctionResult | null;
}
