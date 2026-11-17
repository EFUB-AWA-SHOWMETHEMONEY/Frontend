import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createAuctionStore } from '../src/stores/auctionStore';
import { formatBidInput, validateAuctionBid } from '../src/utils/auctionBid';
import AuctionAuctioneer from '../src/components/auction/AuctionAuctioneer';
import AuctionRoomTimer from '../src/components/auction/AuctionRoomTimer';

const member: Readonly<{ hydrated: boolean; balance: number }> = Object.freeze({
  hydrated: true,
  balance: 100000,
});
function setup(id = 'auction-004') {
  let now = new Date('2026-11-17T13:00:00+09:00');
  const store = createAuctionStore(() => now);
  store.getState().startDemoAuction(id);
  let request = 0;
  return {
    store,
    advance: (ms: number) => {
      now = new Date(now.getTime() + ms);
    },
    bid: (
      value: string,
      bidderId = 'me',
      readMember = () => member,
      requestId = String(++request),
    ) => store.getState().submitBid({ auctionId: id, bidderId, value, requestId }, readMember),
  };
}

test('Public first bid accepts starting-price equality, then requires strictly higher amounts', () => {
  const { store, bid } = setup();
  assert.equal(bid('399').ok, false);
  assert.equal(bid('400').ok, true);
  for (const value of ['399', '400'])
    assert.deepEqual(bid(value), {
      ok: false,
      code: 'HIGHEST_PRICE',
      message: '현재 최고 입찰가보다 높은 금액을 입력해 주세요!',
    });
  assert.equal(bid('1,000', 'other').ok, true);
  const state = store.getState();
  assert.equal(state.bids.length, 2);
  assert.equal(state.getAuction('auction-004')?.highestBid, 1000);
  assert.equal(state.getAuction('auction-004')?.highestBidderId, 'other');
  assert.equal(
    state.auctions.find((a) => a.id === 'auction-004'),
    state.getRoomData('auction-004', 'me')?.auction,
  );
});

test('Private accepts a lower latest bid and hides all opponent prices', () => {
  const { store, bid } = setup('auction-002');
  const floor = store.getState().getAuction('auction-002')!.startingPrice;
  assert.equal(bid(String(floor + 1000)).ok, true);
  assert.equal(bid('99999', 'opponent').ok, true);
  assert.equal(bid(String(floor)).ok, true);
  const room = store.getState().getRoomData('auction-002', 'me')!;
  assert.equal(room.bids.length, 1);
  assert.equal(room.bids[0].amount, floor);
  assert.equal(room.auction.highestBid, null);
  assert.equal(room.auction.highestBidderId, null);
  assert.equal(store.getState().bids.length, 3);
});

test('input validation rejects empty, non-positive, non-integer and unsafe values without mutation', () => {
  const { store, bid } = setup();
  const before = store.getState();
  for (const value of ['', 'abc', '0', '-1', '1.5', '9007199254740992'])
    assert.equal(bid(value).ok, false);
  assert.equal(store.getState(), before);
  assert.equal(formatBidInput('9007199254740992'), '9,007,199,254,740,992');
  assert.equal(formatBidInput('1234'), '1,234');
});

test('submission reads latest balance and hydration without modifying the member snapshot', () => {
  const { store, bid } = setup();
  assert.equal(bid('500', 'me', () => ({ hydrated: false, balance: 100000 })).ok, false);
  assert.equal(bid('500', 'me', () => ({ hydrated: true, balance: 499 })).ok, false);
  assert.equal(bid('500').ok, true);
  assert.deepEqual(member, { hydrated: true, balance: 100000 });
  assert.equal(store.getState().bids.length, 1);
});

test('a valid preview is rejected after another bidder updates the highest price', () => {
  const { store, bid } = setup();
  const state = store.getState();
  assert.equal(
    validateAuctionBid(
      state.getAuction('auction-004'),
      '500',
      member,
      state.getAuctionNow('auction-004')!,
    ).ok,
    true,
  );
  assert.equal(bid('600', 'other').ok, true);
  assert.equal(bid('500').ok, false);
  assert.equal(store.getState().bids.length, 1);
});

test('duplicate and reentrant requests append exactly one bid', () => {
  const { store, bid } = setup('auction-002');
  const unsubscribe = store.subscribe(() => {
    assert.equal(bid('1000', 'me', () => member, 'same').ok, false);
  });
  assert.equal(bid('1000', 'me', () => member, 'same').ok, true);
  unsubscribe();
  assert.equal(bid('1000', 'me', () => member, 'same').ok, false);
  assert.equal(store.getState().bids.length, 1);
});

test('late valid bid extends the deadline, then expiry blocks bids and stores a result', () => {
  const { store, bid, advance } = setup();
  const end = store.getState().getAuction('auction-004')!.endTime;
  advance(295000);
  assert.equal(bid('500').ok, true);
  assert.equal(
    store.getState().getAuction('auction-004')!.endTime,
    new Date(Date.parse(end) + 5000).toISOString(),
  );
  advance(10000);
  assert.equal(bid('600').ok, false);
  assert.equal(store.getState().getAuction('auction-004')!.status, 'ENDED');
  assert.equal(store.getState().results.find((r) => r.auctionId === 'auction-004')?.status, 'SOLD');
});

test('waiting, missing and ended auctions reject bids; manual demo starts once', () => {
  const store = createAuctionStore();
  const submit = (auctionId: string) =>
    store
      .getState()
      .submitBid({ auctionId, bidderId: 'me', value: '1000', requestId: auctionId }, () => member);
  assert.equal(submit('missing').ok, false);
  assert.equal(submit('auction-002').ok, false);
  assert.equal(store.getState().startDemoAuction('auction-002'), true);
  assert.equal(store.getState().startDemoAuction('auction-002'), false);
  store.setState((s) => ({
    auctions: s.auctions.map((a) => (a.id === 'auction-002' ? { ...a, status: 'ENDED' } : a)),
  }));
  assert.equal(submit('auction-002').ok, false);
});

test('waiting timer shows five-minute duration and Private speech distinguishes first/repeat bidding', () => {
  const store = createAuctionStore();
  const auction = store.getState().getAuction('auction-002')!;
  const html = renderToStaticMarkup(
    <AuctionRoomTimer auction={auction} now={store.getState().getAuctionNow(auction.id)!} />,
  );
  assert.match(html, /진행 예정 시간/);
  assert.match(html, /05:00/);
  store.getState().startDemoAuction(auction.id);
  const active = store.getState().getAuction(auction.id)!;
  assert.match(renderToStaticMarkup(<AuctionAuctioneer auction={active} />), /원하는 금액을 입력/);
  assert.match(
    renderToStaticMarkup(<AuctionAuctioneer auction={active} hasOwnBid />),
    /최근에 낸 입찰가가 유효/,
  );
});
