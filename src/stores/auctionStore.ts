import { createStore } from 'zustand/vanilla';
import { auctionFixtures } from '../constants/auction';
import {
  MOCK_AUCTION_CLOCK_START,
  MOCK_AUCTION_DURATION_MS,
  MOCK_AUCTION_MEMBER_ID,
  AUCTION_CHAT_MAX_LENGTH,
} from '../constants/auctionMock';
import type { AuctionSummary, CreateAuctionInput } from '../types/auction';
import type {
  MockAuction,
  MockAuctionBid,
  MockAuctionMessage,
  MockAuctionResult,
  MockAuctionRoomData,
  MockBidInput,
  BidMemberSnapshot,
  BidSubmission,
  MockChatInput,
  ChatSubmission,
} from '../types/auctionMock';
import { createMockAuction } from '../utils/auction';
import {
  effectivePrivateBids,
  endTimeAfterAcceptedBid,
  resolveAuctionResult,
} from '../utils/auctionPolicy';
import { validateAuctionBid } from '../utils/auctionBid';
import { validAuctionChat } from '../utils/auctionChat';

type CreationMember = Parameters<typeof createMockAuction>[1];
type CreationResult = { ok: true; auction: MockAuction } | { ok: false; error: string };

export interface AuctionState {
  /** Single canonical collection: both list and detail read these same records. */
  auctions: readonly MockAuction[];
  bids: readonly MockAuctionBid[];
  messages: readonly MockAuctionMessage[];
  results: readonly MockAuctionResult[];
  getAuction: (auctionId: string) => MockAuction | undefined;
  getRoomData: (auctionId: string, viewerId: string) => MockAuctionRoomData | undefined;
  getAuctionNow: (auctionId: string, realNow?: Date) => Date | undefined;
  createAuction: (input: CreateAuctionInput, member: CreationMember, now?: Date) => CreationResult;
  startDemoAuction: (auctionId: string) => boolean;
  submitBid: (input: MockBidInput, readMember: () => BidMemberSnapshot) => BidSubmission;
  sendChat: (input: MockChatInput) => ChatSubmission;
  finishExpiredAuctions: () => void;
}

function extendSummary(
  summary: AuctionSummary,
  sellerId: string,
  timeBasis: MockAuction['timeBasis'],
): MockAuction {
  return {
    ...summary,
    sellerId,
    highestBid: null,
    highestBidderId: null,
    scheduledStartTime: summary.startTime,
    startedAt: summary.status === 'IN_PROGRESS' ? summary.startTime : undefined,
    endTime: new Date(Date.parse(summary.startTime) + MOCK_AUCTION_DURATION_MS).toISOString(),
    version: 0,
    timeBasis,
  };
}

/** Fresh factory = full reload. No persistence, timers, network calls or member mutations.
 * Use the singleton below across client routes; never create a store in the list component.
 * The injectable clock keeps tests deterministic and historic fixtures off the wall clock.
 */
export function createAuctionStore(realNow: () => Date = () => new Date()) {
  const realAnchor = realNow().getTime();
  const demoAnchor = Date.parse(MOCK_AUCTION_CLOCK_START);
  let nextAuctionId = 1;
  let nextBidId = 1;
  const acceptedRequests = new Set<string>();
  const acceptedChatRequests = new Set<string>();
  let nextMessageId = 1;

  return createStore<AuctionState>()((set, get) => ({
    auctions: auctionFixtures.map((summary) =>
      extendSummary(summary, `mock-seller-${summary.id}`, 'DEMO'),
    ),
    bids: [],
    messages: [],
    results: [],
    finishExpiredAuctions: () => {
      const state = get();
      const expired = state.auctions.filter(
        (a) =>
          a.status === 'IN_PROGRESS' &&
          Date.parse(a.endTime) <= state.getAuctionNow(a.id)!.getTime(),
      );
      if (!expired.length) return;
      const ids = new Set(expired.map((a) => a.id));
      const results = expired
        .filter((a) => !state.results.some((r) => r.auctionId === a.id))
        .map((a) => resolveAuctionResult(a, state.bids));
      set({
        auctions: state.auctions.map((a) =>
          ids.has(a.id) ? { ...a, status: 'ENDED', canEnter: false, version: a.version + 1 } : a,
        ),
        results: [...state.results, ...results],
      });
    },
    sendChat: (input) => {
      get().finishExpiredAuctions();
      const auction = get().getAuction(input.auctionId);
      if (
        !auction ||
        auction.status === 'ENDED' ||
        get().results.some((result) => result.auctionId === input.auctionId)
      )
        return { ok: false, error: '종료되었거나 존재하지 않는 경매방이에요.' };
      if (
        !input.senderId ||
        !input.senderName.trim() ||
        !input.requestId ||
        !validAuctionChat(input.content)
      )
        return { ok: false, error: `1~${AUCTION_CHAT_MAX_LENGTH}자의 메시지를 입력해 주세요.` };
      if (acceptedChatRequests.has(input.requestId))
        return { ok: false, error: '이미 전송한 요청이에요.' };
      let messageId: string;
      do {
        messageId = `mock-message-${nextMessageId++}`;
      } while (get().messages.some((message) => message.messageId === messageId));
      const message: MockAuctionMessage = {
        messageId,
        auctionId: input.auctionId,
        senderId: input.senderId,
        senderName: input.senderName,
        content: input.content.trim(),
        createdAt: realNow().toISOString(),
      };
      acceptedChatRequests.add(input.requestId);
      set((state) => ({ messages: [...state.messages, message] }));
      return { ok: true, message };
    },
    startDemoAuction: (id) => {
      const auction = get().getAuction(id);
      if (!auction || auction.status !== 'SCHEDULED') return false;
      const now = get().getAuctionNow(id)!;
      set((state) => ({
        auctions: state.auctions.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'IN_PROGRESS',
                startedAt: now.toISOString(),
                endTime: new Date(now.getTime() + MOCK_AUCTION_DURATION_MS).toISOString(),
                version: entry.version + 1,
              }
            : entry,
        ),
      }));
      return true;
    },
    submitBid: (input, readMember) => {
      if (!input.requestId || !input.bidderId)
        return { ok: false, code: 'INVALID_REQUEST', message: '입찰 요청을 다시 확인해 주세요.' };
      if (acceptedRequests.has(input.requestId))
        return { ok: false, code: 'DUPLICATE', message: '이미 처리한 입찰이에요.' };
      // Read current member and auction at the command boundary, not the modal's opening snapshot.
      const member = readMember();
      get().finishExpiredAuctions();
      const auction = get().getAuction(input.auctionId);
      const now = get().getAuctionNow(input.auctionId) ?? realNow();
      const validation = validateAuctionBid(auction, input.value, member, now);
      if (!validation.ok) return validation;
      let bidId: string;
      do {
        bidId = `mock-bid-${nextBidId++}`;
      } while (get().bids.some((bid) => bid.bidId === bidId));
      const bid: MockAuctionBid = {
        bidId,
        auctionId: input.auctionId,
        bidderId: input.bidderId,
        amount: validation.amount,
        submittedAt: now.toISOString(),
      };
      // Mark before notifying subscribers: reentrant/repeated requests cannot append twice.
      acceptedRequests.add(input.requestId);
      set((state) => ({
        bids: [...state.bids, bid],
        auctions: state.auctions.map((entry) =>
          entry.id === input.auctionId
            ? {
                ...entry,
                version: entry.version + 1,
                endTime: endTimeAfterAcceptedBid(entry.type, entry.endTime, bid.submittedAt),
                ...(entry.type === 'PUBLIC'
                  ? { highestBid: bid.amount, highestBidderId: bid.bidderId }
                  : {}),
              }
            : entry,
        ),
      }));
      // Settlement and item transfer remain intentionally absent.
      return { ok: true, bid };
    },
    getAuction: (id) => get().auctions.find((auction) => auction.id === id),
    getAuctionNow: (id, now = realNow()) => {
      const auction = get().getAuction(id);
      if (!auction) return undefined;
      return auction.timeBasis === 'DEMO'
        ? new Date(demoAnchor + now.getTime() - realAnchor)
        : new Date(now.getTime());
    },
    getRoomData: (id, viewerId) => {
      const state = get();
      const auction = state.getAuction(id);
      if (!auction) return undefined;
      const isPrivate = auction.type === 'PRIVATE';
      return {
        auction: isPrivate ? { ...auction, highestBid: null, highestBidderId: null } : auction,
        bids: isPrivate
          ? effectivePrivateBids(state.bids, id).filter((bid) => bid.bidderId === viewerId)
          : state.bids.filter((bid) => bid.auctionId === id),
        messages: state.messages.filter((message) => message.auctionId === id),
        result:
          auction.status === 'ENDED'
            ? (state.results.find((result) => result.auctionId === id) ?? null)
            : null,
      };
    },
    createAuction: (input, member, now = realNow()) => {
      const result = createMockAuction(input, member, now, () => {
        let id: string;
        do {
          id = `auction-created-${nextAuctionId++}`;
        } while (get().getAuction(id));
        return id;
      });
      if (!result.ok) return result;
      const auction = extendSummary(result.auction, MOCK_AUCTION_MEMBER_ID, 'REAL');
      set((state) => ({ auctions: [auction, ...state.auctions] }));
      return { ok: true, auction };
    },
  }));
}

export const auctionStore = createAuctionStore();
