import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createAuctionStore } from '../src/stores/auctionStore';
import AuctionResultModal from '../src/components/auction/AuctionResultModal';
import AuctionRoom from '../src/components/auction/AuctionRoom';

function setup(id = 'auction-004') {
  let time = new Date('2026-11-17T04:00:00Z');
  const store = createAuctionStore(() => time);
  store.getState().startDemoAuction(id);
  let seq = 0;
  return {
    store,
    id,
    advance: (ms: number) => {
      time = new Date(time.getTime() + ms);
    },
    bid: (amount: number, bidderId = 'a') =>
      store
        .getState()
        .submitBid(
          { auctionId: id, bidderId, value: String(amount), requestId: String(++seq) },
          () => ({ hydrated: true, balance: 10000 }),
        ),
  };
}

test('Public extension boundaries 11/10/1/0 are atomic with bid acceptance', () => {
  for (const seconds of [11, 10, 1, 0]) {
    const { store, id, advance, bid } = setup();
    const end = Date.parse(store.getState().getAuction(id)!.endTime);
    advance(300000 - seconds * 1000);
    const snapshots: { highest: number | null; end: string }[] = [];
    store.subscribe((state) => {
      const a = state.getAuction(id)!;
      snapshots.push({ highest: a.highestBid, end: a.endTime });
    });
    assert.equal(bid(1000).ok, seconds > 0);
    const expected = seconds > 0 && seconds <= 10 ? end + (10 - seconds) * 1000 : end;
    assert.equal(Date.parse(store.getState().getAuction(id)!.endTime), expected);
    assert.equal(snapshots.length, 1);
    assert.equal(snapshots[0].highest, seconds > 0 ? 1000 : null);
    if (!seconds) assert.equal(store.getState().getAuction(id)!.status, 'ENDED');
  }
});

test('Private latest lower bids decide winner, no extension, result hidden until deadline', () => {
  const { store, id, advance, bid } = setup('auction-002');
  bid(2000, 'a');
  bid(1500, 'b');
  bid(1000, 'a');
  const end = store.getState().getAuction(id)!.endTime;
  advance(299000);
  assert.equal(bid(1200, 'a').ok, true);
  assert.equal(store.getState().getAuction(id)!.endTime, end);
  assert.equal(store.getState().getRoomData(id, 'a')!.result, null);
  advance(1000);
  store.getState().finishExpiredAuctions();
  assert.deepEqual(store.getState().getRoomData(id, 'a')!.result, {
    auctionId: id,
    endedAt: end,
    status: 'SOLD',
    winnerId: 'b',
    winningAmount: 1500,
  });
  assert.equal(store.getState().getRoomData(id, 'a')!.bids.length, 1);
});

test('expiry is idempotent, preserves chat, rejects stale bid/chat submission and disables list entry', () => {
  const { store, id, advance, bid } = setup();
  const chat = { auctionId: id, senderId: 'a', senderName: 'A', content: '안녕', requestId: 'c1' };
  store.getState().sendChat(chat);
  advance(300000);
  assert.equal(store.getState().sendChat({ ...chat, requestId: 'c2' }).ok, false);
  const state = store.getState();
  store.getState().finishExpiredAuctions();
  assert.equal(store.getState(), state);
  assert.equal(bid(1000).ok, false);
  assert.equal(state.messages.length, 1);
  assert.equal(state.getAuction(id)!.canEnter, false);
  assert.equal(state.results.filter((r) => r.auctionId === id).length, 1);
  assert.equal(state.getRoomData(id, 'a')!.result?.status, 'UNSOLD');
});

test('Private equal latest prices remain unresolved instead of choosing a winner', () => {
  const { store, id, advance, bid } = setup('auction-002');
  bid(1500, 'a');
  bid(1500, 'b');
  advance(300000);
  store.getState().finishExpiredAuctions();
  const result = store.getState().getRoomData(id, 'a')!.result!;
  assert.equal(result.status, 'PENDING_TIE');
  assert.equal(result.winnerId, null);
  assert.equal(result.winningAmount, null);
  assert.equal(bid(2000, 'c').ok, false);
  assert.equal(
    store
      .getState()
      .sendChat({
        auctionId: id,
        senderId: 'a',
        senderName: '나',
        content: '추가',
        requestId: 'tie-chat',
      }).ok,
    false,
  );
  const html = renderToStaticMarkup(
    <AuctionRoom room={store.getState().getRoomData(id, 'a')!} viewerId="a" nickname="나" />,
  );
  assert.match(html, /판정이 보류/);
  assert.match(html, /동률 정책 확인 필요/);
  const modal = html.slice(html.indexOf('<dialog'));
  assert.doesNotMatch(modal, /님이 낙찰받았어요|낙찰가|유찰|1,500/);
  assert.match(html, /inert=""/);
  assert.match(html, /<input[^>]*disabled=""/);
});

test('unknown winner identity never appears in room HTML; own nickname is preserved', () => {
  const { store, id, advance, bid } = setup();
  bid(1000, 'private-member-id-987');
  advance(300000);
  store.getState().finishExpiredAuctions();
  const room = store.getState().getRoomData(id, 'viewer')!;
  const html = renderToStaticMarkup(<AuctionRoom room={room} viewerId="viewer" nickname="나" />);
  assert.doesNotMatch(html, /private-member-id-987/);
  assert.match(html, /참가자님이 낙찰받았어요/);
  const own = renderToStaticMarkup(
    <AuctionRoom room={room} viewerId="private-member-id-987" nickname="내닉네임" />,
  );
  assert.match(own, /내닉네임님이 낙찰받았어요/);
});

test('submission processing time wins over an earlier valid input snapshot', () => {
  const { store, id, advance } = setup();
  advance(299999);
  const result = store
    .getState()
    .submitBid({ auctionId: id, bidderId: 'a', value: '1000', requestId: 'cross-deadline' }, () => {
      // Deadline passes while obtaining the latest member snapshot.
      advance(1);
      return { hydrated: true, balance: 10000 };
    });
  assert.equal(result.ok, false);
  assert.equal(store.getState().bids.length, 0);
  assert.equal(store.getState().getRoomData(id, 'a')!.result?.status, 'UNSOLD');
});

test('a bid accepted just before the deadline survives a subsequent stale timer check', () => {
  const { store, id, advance, bid } = setup();
  advance(299999);
  assert.equal(bid(1000).ok, true);
  advance(1);
  store.getState().finishExpiredAuctions();
  assert.equal(store.getState().getAuction(id)!.status, 'IN_PROGRESS');
  assert.equal(store.getState().getRoomData(id, 'a')!.result, null);
});

test('repeated mount/focus/visibility-style checks and reentrant subscribers publish only one expiry', () => {
  const { store, id, advance } = setup();
  const version = store.getState().getAuction(id)!.version;
  let updates = 0;
  store.subscribe(() => {
    updates++;
    store.getState().finishExpiredAuctions();
  });
  advance(300000);
  for (let i = 0; i < 8; i++) store.getState().finishExpiredAuctions();
  assert.equal(updates, 1);
  assert.equal(store.getState().getAuction(id)!.version, version + 1);
  assert.equal(store.getState().results.filter((r) => r.auctionId === id).length, 1);
});

test('all result variants show item and plaza link without close controls or bid-success notice', () => {
  const { store, id } = setup();
  const auction = store.getState().getAuction(id)!;
  const results = [
    {
      auctionId: id,
      endedAt: auction.endTime,
      status: 'SOLD' as const,
      winnerId: 'a',
      winningAmount: 1500,
    },
    {
      auctionId: id,
      endedAt: auction.endTime,
      status: 'UNSOLD' as const,
      winnerId: null,
      winningAmount: null,
    },
    {
      auctionId: id,
      endedAt: auction.endTime,
      status: 'PENDING_TIE' as const,
      winnerId: null,
      winningAmount: null,
    },
  ];
  for (const result of results) {
    const html = renderToStaticMarkup(
      <AuctionResultModal auction={auction} result={result} winnerName="테스터" />,
    );
    assert.match(html, /<dialog/);
    assert.match(html, /href="\/"/);
    assert.match(html, /광장으로 이동/);
    assert.match(html, /리본 헤어핀/);
    assert.doesNotMatch(html, /닫기|입찰이 완료/);
    assert.match(
      html,
      result.status === 'SOLD'
        ? /테스터님이 낙찰.*1,500/
        : result.status === 'UNSOLD'
          ? /유찰/
          : /판정이 보류/,
    );
  }
});
