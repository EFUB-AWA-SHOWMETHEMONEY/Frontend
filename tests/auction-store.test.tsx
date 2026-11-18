import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import AuctionList from '../src/components/auction/AuctionList';
import { auctionFixtures } from '../src/constants/auction';
import { MOCK_AUCTION_MEMBER_ID } from '../src/constants/auctionMock';
import { createAuctionStore } from '../src/stores/auctionStore';
import type { AuctionSummary, AuctionType, CreateAuctionInput } from '../src/types/auction';
import type { MockAuctionBid, MockAuctionResult } from '../src/types/auctionMock';
import { viewportScale } from '../src/utils/viewport';
import {
  currencySettlementPolicy,
  effectivePrivateBids,
  endTimeAfterAcceptedBid,
  exceedsPublicHighestBid,
  itemTransferPolicy,
  minimumBidPolicy,
  tiedBidPolicy,
} from '../src/utils/auctionPolicy';

const now = new Date('2026-11-17T13:00:00+09:00');
const member = Object.freeze({
  hydrated: true,
  balance: 1000,
  inventory: Object.freeze([Object.freeze({ instanceId: 'owned-1', productId: 'ribbon' })]),
});
const input: CreateAuctionInput = {
  ownedItemInstanceId: 'owned-1',
  startingPrice: 800,
  startTime: '2026-11-17T13:10:00+09:00',
  type: 'PUBLIC',
};
const freshStore = () => createAuctionStore(() => now);

function renderList(
  auctions: readonly AuctionSummary[],
  filter: AuctionType | 'ALL',
  page: number,
) {
  return renderToStaticMarkup(
    <AuctionList
      auctions={auctions}
      filter={filter}
      page={page}
      notice={null}
      onFilterChange={() => {}}
      onPageChange={() => {}}
      onCreate={() => {}}
      onEnter={() => {}}
    />,
  );
}

function cardIds(markup: string) {
  return [...markup.matchAll(/<article[^>]+aria-labelledby="title-([^"]+)"/g)].map((m) => m[1]);
}

test('five-card pagination advances and returns with correct boundary controls', () => {
  const auctions = freshStore().getState().auctions;
  let page = 1;
  const list = () =>
    AuctionList({
      auctions,
      filter: 'ALL',
      page,
      notice: null,
      onFilterChange: () => {},
      onPageChange: (next) => {
        page = next;
      },
      onCreate: () => {},
      onEnter: () => {},
    });
  const controls = () => list().props.children[1].props.children[2].props.children;
  assert.equal(controls()[0].props.disabled, true);
  assert.equal(controls()[2].props.disabled, false);
  assert.equal(cardIds(renderList(auctions, 'ALL', page)).length, 5);
  controls()[2].props.onClick();
  assert.equal(page, 2);
  assert.equal(cardIds(renderList(auctions, 'ALL', page)).length, 2);
  assert.equal(controls()[0].props.disabled, false);
  assert.equal(controls()[2].props.disabled, true);
  controls()[0].props.onClick();
  assert.equal(page, 1);
});

test('five unchanged cards fit between panel padding and navigation at every viewport scale', () => {
  const html = renderList(freshStore().getState().auctions, 'ALL', 1);
  assert.match(html, /w-\[1820px\]/);
  assert.match(html, /px-20/);
  assert.equal((html.match(/w-\[300px\]/g) ?? []).length, 5);
  assert.match(html, /flex gap-10/);
  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [390, 844],
  ]) {
    const scale = viewportScale(width, height, 1920, 1080);
    assert.ok((5 * 300 + 4 * 40) * scale <= (1820 - 2 * 80) * scale);
    assert.ok((50 + 80 + 5 * 300 + 4 * 40) * scale < (50 + 1820 - 14 - 44) * scale);
    assert.ok((284 + 40 + 61 + 32 + 441) * scale < (943 - 20 - 35) * scale);
  }
});

test('initial list keeps every existing fixture field, card order and admission label', () => {
  const store = freshStore();
  for (const fixture of auctionFixtures) {
    const auction = store.getState().getAuction(fixture.id)!;
    for (const key of Object.keys(fixture) as (keyof AuctionSummary)[]) {
      assert.deepEqual(auction[key], fixture[key]);
    }
    assert.notEqual(auction.sellerId, MOCK_AUCTION_MEMBER_ID);
  }
  const html = renderList(store.getState().auctions, 'ALL', 1);
  assert.deepEqual(cardIds(html), [
    'auction-001',
    'auction-002',
    'auction-003',
    'auction-004',
    'auction-005',
  ]);
  assert.match(html, /마법사 모자 진행 중/);
  assert.match(html, /하트 선글라스 입장하기/);
});

test('Public/Private filtering, pagination and empty list still render correctly', () => {
  const auctions = freshStore().getState().auctions;
  assert.deepEqual(cardIds(renderList(auctions, 'PUBLIC', 1)), [
    'auction-001',
    'auction-004',
    'auction-006',
    'auction-007',
  ]);
  assert.deepEqual(cardIds(renderList(auctions, 'PUBLIC', 2)), [
    'auction-001',
    'auction-004',
    'auction-006',
    'auction-007',
  ]);
  assert.deepEqual(cardIds(renderList(auctions, 'PRIVATE', 1)), [
    'auction-002',
    'auction-003',
    'auction-005',
  ]);
  assert.deepEqual(cardIds(renderList(auctions, 'ALL', 2)), ['auction-006', 'auction-007']);
  assert.deepEqual(cardIds(renderList(auctions, 'ALL', 3)), ['auction-006', 'auction-007']);
  assert.match(renderList([], 'ALL', 1), /등록된 경매가 없습니다/);
});

test('creation updates subscribed list and detail lookup without touching the member ledger', () => {
  const store = freshStore();
  const before = structuredClone(member);
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  const result = store.getState().createAuction(input, member);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(updates, 1);
  assert.equal(store.getState().auctions[0], result.auction);
  assert.equal(store.getState().getAuction(result.auction.id), result.auction);
  assert.equal(result.auction.sellerId, MOCK_AUCTION_MEMBER_ID);
  assert.equal(result.auction.scheduledStartTime, input.startTime);
  assert.ok(Date.parse(result.auction.endTime) > Date.parse(input.startTime));
  assert.equal(cardIds(renderList(store.getState().auctions, 'ALL', 1))[0], result.auction.id);
  assert.equal(cardIds(renderList(store.getState().auctions, 'ALL', 1)).length, 5);
  assert.equal(cardIds(renderList(store.getState().auctions, 'ALL', 2)).length, 3);
  assert.deepEqual(member, before);
  unsubscribe();
});

test('invalid creation leaves all shared data unchanged and uses real-date validation', () => {
  const store = freshStore();
  const before = store.getState();
  assert.equal(store.getState().createAuction(input, { ...member, hydrated: false }).ok, false);
  assert.equal(store.getState().createAuction(input, { ...member, inventory: [] }).ok, false);
  assert.equal(store.getState().createAuction({ ...input, startingPrice: 0 }, member).ok, false);
  assert.equal(
    store.getState().createAuction({ ...input, startTime: auctionFixtures[0].startTime }, member)
      .ok,
    false,
  );
  assert.equal(store.getState(), before);
});

test('IDs stay unique across callers and route subscriptions; unknown IDs are absent', () => {
  const store = freshStore();
  const first = store.getState().createAuction(input, member);
  assert.equal(first.ok, true);
  if (!first.ok) return;
  const leaveList = store.subscribe(() => {});
  leaveList();
  // A new route uses the existing store, not a new component-local collection.
  const enterDetail = store.subscribe(() => {});
  assert.equal(
    store.getState().getRoomData(first.auction.id, MOCK_AUCTION_MEMBER_ID)?.auction,
    first.auction,
  );
  const second = store.getState().createAuction({ ...input, type: 'PRIVATE' }, member);
  assert.equal(second.ok, true);
  if (!second.ok) return;
  assert.notEqual(first.auction.id, second.auction.id);
  assert.equal(store.getState().getAuction('missing'), undefined);
  assert.equal(store.getState().getRoomData('__proto__', MOCK_AUCTION_MEMBER_ID), undefined);
  assert.equal(store.getState().getAuctionNow('missing'), undefined);
  enterDetail();
});

test('fresh store restores fixtures and empty histories, independently of an existing session', () => {
  const first = freshStore();
  first.getState().createAuction(input, member);
  const reloaded = freshStore();
  assert.equal(first.getState().auctions.length, 8);
  assert.equal(reloaded.getState().auctions.length, 7);
  assert.deepEqual(reloaded.getState().bids, []);
  assert.deepEqual(reloaded.getState().messages, []);
  assert.deepEqual(reloaded.getState().results, []);
  assert.equal(reloaded.getState().getAuction('auction-created-1'), undefined);
});

test('historic fixtures use demo time, new auctions use wall time, neither auto-transitions', () => {
  const store = freshStore();
  const fixture = store.getState().getAuction('auction-001')!;
  const demoNow = store.getState().getAuctionNow(fixture.id)!;
  assert.equal(demoNow.toISOString(), '2026-11-14T05:00:00.000Z');
  assert.ok(Date.parse(fixture.endTime) > demoNow.getTime());
  const later = new Date(now.getTime() + 30_000);
  assert.equal(
    store.getState().getAuctionNow(fixture.id, later)!.getTime() - demoNow.getTime(),
    30_000,
  );
  const created = store.getState().createAuction(input, member);
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(
    store.getState().getAuctionNow(created.auction.id, later)!.getTime(),
    later.getTime(),
  );
  store.getState().getAuctionNow(fixture.id, new Date(now.getTime() + 86_400_000));
  assert.equal(store.getState().getAuction(fixture.id)?.status, 'IN_PROGRESS');
});

const bid = (
  bidId: string,
  bidderId: string,
  amount: number,
  auctionId = 'auction-002',
): MockAuctionBid => ({
  bidId,
  auctionId,
  bidderId,
  amount,
  submittedAt: '2026-11-14T05:31:00.000Z',
});

test('Private history supports repeat submissions, including a lower latest price', () => {
  const history = [
    bid('bid-1', 'a', 1000),
    bid('bid-2', 'b', 1200),
    bid('bid-3', 'a', 900),
    bid('bid-4', 'a', 2000, 'other'),
  ];
  assert.deepEqual(
    effectivePrivateBids(history, 'auction-002').map((b) => b.bidId),
    ['bid-3', 'bid-2'],
  );
  assert.equal(history.length, 4);
});

test('Private room projection hides opponents, highest amounts and unpublished results', () => {
  const store = freshStore();
  const result: MockAuctionResult = {
    auctionId: 'auction-002',
    status: 'SOLD',
    winnerId: 'b',
    winningAmount: 1200,
    endedAt: '2026-11-14T05:35:00Z',
  };
  // Seed a future adapter snapshot; no bid/settlement action is introduced in this stage.
  store.setState({
    bids: [bid('bid-1', 'a', 1000), bid('bid-2', 'b', 1200), bid('bid-3', 'a', 900)],
    auctions: store
      .getState()
      .auctions.map((a) =>
        a.id === 'auction-002' ? { ...a, highestBid: 1200, highestBidderId: 'b' } : a,
      ),
    results: [result],
    messages: [
      {
        messageId: 'message-1',
        auctionId: 'auction-002',
        senderId: 'b',
        senderName: '친구',
        content: '안녕',
        createdAt: now.toISOString(),
      },
    ],
  });
  const room = store.getState().getRoomData('auction-002', 'a')!;
  assert.deepEqual(
    room.bids.map((b) => b.bidId),
    ['bid-3'],
  );
  assert.equal(room.auction.highestBid, null);
  assert.equal(room.auction.highestBidderId, null);
  assert.equal(room.result, null);
  assert.equal(room.messages.length, 1);
  assert.deepEqual(store.getState().getRoomData('auction-002', 'outsider')!.bids, []);
  assert.equal(store.getState().getRoomData('auction-001', 'a')!.messages.length, 0);
});

test('a shared Public snapshot update is visible to both list and detail readers', () => {
  const store = freshStore();
  store.setState((state) => ({
    auctions: state.auctions.map((a) =>
      a.id === 'auction-001'
        ? { ...a, highestBid: 1300, highestBidderId: 'a', version: a.version + 1 }
        : a,
    ),
  }));
  const listRecord = store.getState().auctions.find((a) => a.id === 'auction-001')!;
  const detail = store.getState().getRoomData('auction-001', 'a')!;
  assert.equal(listRecord, detail.auction);
  assert.equal(detail.auction.highestBid, 1300);
  assert.equal(detail.auction.version, 1);
  assert.equal(auctionFixtures[0].status, 'IN_PROGRESS');
});

test('Public requires a higher price and extends only accepted bids in the final 10 seconds', () => {
  assert.equal(exceedsPublicHighestBid(1300, 1300), false);
  assert.equal(exceedsPublicHighestBid(1200, 1300), false);
  assert.equal(exceedsPublicHighestBid(1400, 1300), true);
  const end = '2026-11-14T05:35:00.000Z';
  for (const seconds of [11, 10, 9, 1, 0, -1]) {
    const submitted = new Date(Date.parse(end) - seconds * 1000).toISOString();
    const expected =
      seconds > 0 && seconds <= 10 ? new Date(Date.parse(submitted) + 10_000).toISOString() : end;
    assert.equal(endTimeAfterAcceptedBid('PUBLIC', end, submitted), expected);
    assert.equal(endTimeAfterAcceptedBid('PRIVATE', end, submitted), end);
  }
});

test('unconfirmed rules return unresolved rather than inventing business behavior', () => {
  for (const policy of [
    minimumBidPolicy,
    tiedBidPolicy,
    currencySettlementPolicy,
    itemTransferPolicy,
  ]) {
    assert.deepEqual(policy(), { status: 'UNRESOLVED' });
  }
});
