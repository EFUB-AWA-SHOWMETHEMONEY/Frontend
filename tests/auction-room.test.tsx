import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { renderToStaticMarkup } from 'react-dom/server';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import AuctionDetailPage from '../src/app/(main)/auction/[auctionId]/page';
import AuctionDetailContainer from '../src/components/auction/AuctionDetailContainer';
import AuctionCard from '../src/components/auction/AuctionCard';
import AuctionRoom from '../src/components/auction/AuctionRoom';
import MainShell from '../src/components/layout/MainShell';
import { createAuctionStore } from '../src/stores/auctionStore';
import { MOCK_AUCTION_MEMBER_ID } from '../src/constants/auctionMock';
import {
  auctionEntryPath,
  auctionRemainingSeconds,
  formatAuctionRemaining,
} from '../src/utils/auctionRoom';
import { viewportScale } from '../src/utils/viewport';

const viewerId = MOCK_AUCTION_MEMBER_ID;
const makeStore = () => createAuctionStore(() => new Date('2026-11-17T13:00:00+09:00'));

test('demo start control appears only in development, never in production', () => {
  const script = `
    const React = require('react');
    const { renderToStaticMarkup } = require('react-dom/server');
    const AuctionRoom = require('./src/components/auction/AuctionRoom').default;
    const { createAuctionStore } = require('./src/stores/auctionStore');
    const room = createAuctionStore().getState().getRoomData('auction-004', 'me');
    process.stdout.write(renderToStaticMarkup(React.createElement(AuctionRoom, { room, viewerId: 'me', nickname: '나' })));
  `;
  for (const mode of ['development', 'production'] as const) {
    const result = spawnSync(process.execPath, ['--import', 'tsx', '-e', script], {
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: mode },
    });
    assert.equal(result.status, 0, result.stderr);
    if (mode === 'production') assert.doesNotMatch(result.stdout, /데모 경매 시작|테스트용/);
    else assert.match(result.stdout, /데모 경매 시작/);
  }
});

test('dynamic route awaits params and passes the exact requested ID, even for unknown IDs', async () => {
  for (const auctionId of ['auction-002', 'auction-004', 'does-not-exist']) {
    const page = await AuctionDetailPage({ params: Promise.resolve({ auctionId }) });
    assert.equal(page.type, AuctionDetailContainer);
    assert.equal(page.props.auctionId, auctionId);
    assert.equal(page.key, auctionId);
  }
  assert.equal(makeStore().getState().getRoomData('does-not-exist', viewerId), undefined);
});

test('server snapshot shows loading rather than prematurely classifying client-created IDs as invalid', () => {
  const html = renderToStaticMarkup(<AuctionDetailContainer auctionId="auction-created-1" />);
  assert.match(html, /경매방을 불러오는 중/);
  assert.doesNotMatch(html, /경매방을 찾을 수 없어요/);
});

test('card ID contract and navigation boundary preserve Public/Private targets and closed admission', () => {
  const state = makeStore().getState();
  for (const id of ['auction-002', 'auction-004']) {
    const auction = state.getAuction(id)!;
    let requestedId = '';
    const card = AuctionCard({
      auction,
      onEnter: (value) => {
        requestedId = value;
      },
    });
    const button = card.props.children.at(-1);
    assert.equal(button.props.disabled, false);
    button.props.onClick();
    assert.equal(requestedId, id);
    assert.equal(auctionEntryPath(state.getAuction(requestedId)), `/auction/${id}`);
  }
  for (const id of ['auction-001', 'auction-005']) {
    const auction = state.getAuction(id)!;
    const html = renderToStaticMarkup(
      <AuctionCard auction={auction} onEnter={() => assert.fail('closed card navigated')} />,
    );
    assert.match(html, /<button[^>]*disabled=""/);
    assert.equal(auctionEntryPath(auction), null);
  }
  assert.equal(auctionEntryPath(undefined), null);
});

test('newly created auction has a route and survives list/detail reads until a full reset', () => {
  const store = makeStore();
  const created = store.getState().createAuction(
    {
      ownedItemInstanceId: 'owned-1',
      startingPrice: 800,
      startTime: '2026-11-17T13:10:00+09:00',
      type: 'PUBLIC',
    },
    { hydrated: true, inventory: [{ instanceId: 'owned-1', productId: 'ribbon' }] },
  );
  assert.equal(created.ok, true);
  if (!created.ok) return;
  assert.equal(auctionEntryPath(created.auction), `/auction/${created.auction.id}`);
  const room = store.getState().getRoomData(created.auction.id, viewerId)!;
  assert.equal(room.auction.itemName, '리본 헤어핀');
  assert.equal(store.getState().auctions[0], room.auction);
  assert.equal(makeStore().getState().getAuction(created.auction.id), undefined);
});

test('Public initial room renders the actual item, empty bid state and list exit without duplicate shell', () => {
  const room = makeStore().getState().getRoomData('auction-004', viewerId)!;
  const html = renderToStaticMarkup(
    <AuctionRoom room={room} viewerId={viewerId} nickname="내 닉네임" />,
  );
  assert.match(html, /Public 경매방/);
  assert.match(html, /리본 헤어핀/);
  assert.match(html, /시작가 400/);
  assert.match(html, /아직 입찰 없음/);
  assert.doesNotMatch(html, /내 닉네임/);
  assert.match(html, /href="\/auction"/);
  assert.match(html, /room-scene.png/);
  assert.doesNotMatch(html, /<header|fixed inset-0|auction-bg.webp/);
  assert.match(html, /<input[^>]*disabled=""/);
  assert.match(html, /메시지를 입력하세요/);
  assert.match(html, /aria-expanded="true"/);
});

test('Public price and bidder view updates from the shared record, not the reference image', () => {
  const store = makeStore();
  store.setState((state) => ({
    auctions: state.auctions.map((auction) =>
      auction.id === 'auction-004'
        ? { ...auction, highestBid: 1700, highestBidderId: viewerId, version: 1 }
        : auction,
    ),
  }));
  const room = store.getState().getRoomData('auction-004', viewerId)!;
  const html = renderToStaticMarkup(
    <AuctionRoom room={room} viewerId={viewerId} nickname="실제 닉네임" />,
  );
  assert.match(html, /1,700/);
  assert.match(html, /실제 닉네임/);
  assert.match(html, /avatar-tiger.svg/);
  assert.doesNotMatch(html, /아직 입찰 없음/);
});

test('Private HTML contains only the latest own bid and never an opponent amount or ID', () => {
  const store = makeStore();
  store.getState().startDemoAuction('auction-002');
  store.setState({
    bids: [
      {
        bidId: 'a',
        auctionId: 'auction-002',
        bidderId: viewerId,
        amount: 1100,
        submittedAt: '2026-11-14T05:31:00Z',
      },
      {
        bidId: 'b',
        auctionId: 'auction-002',
        bidderId: 'secret-opponent',
        amount: 876543,
        submittedAt: '2026-11-14T05:31:01Z',
      },
      {
        bidId: 'c',
        auctionId: 'auction-002',
        bidderId: viewerId,
        amount: 900,
        submittedAt: '2026-11-14T05:31:02Z',
      },
    ],
  });
  const html = renderToStaticMarkup(
    <AuctionRoom
      room={store.getState().getRoomData('auction-002', viewerId)!}
      viewerId={viewerId}
      nickname="내 닉네임"
    />,
  );
  assert.match(html, /Private 경매방/);
  assert.match(html, /하트 선글라스/);
  assert.match(html, /내 입찰가/);
  assert.match(html, />900</);
  assert.match(html, /최근에 낸 입찰가가 유효해요/);
  assert.match(html, /비공개 입찰/);
  assert.doesNotMatch(html, /876,543|876543|secret-opponent|1,100|한 번만|최고 입찰자/);
});

test('MainShell supplies exactly one Header and fixed viewport to a detail room', () => {
  const room = makeStore().getState().getRoomData('auction-002', viewerId)!;
  const html = renderToStaticMarkup(
    <PathnameContext.Provider value="/auction/auction-002">
      <MainShell>
        <AuctionRoom room={room} viewerId={viewerId} nickname="나" />
      </MainShell>
    </PathnameContext.Provider>,
  );
  assert.equal((html.match(/<header\b/g) ?? []).length, 1);
  assert.equal((html.match(/fixed inset-0/g) ?? []).length, 1);
  assert.equal((html.match(/alt="MoaMoa"/g) ?? []).length, 1);
});

test('timer display clamps expiry, formats MM:SS and uses the store demo clock without ending the auction', () => {
  const store = makeStore();
  const auction = store.getState().getAuction('auction-001')!;
  assert.equal(
    formatAuctionRemaining(
      auctionRemainingSeconds(auction.endTime, store.getState().getAuctionNow(auction.id)!),
    ),
    '05:00',
  );
  assert.equal(formatAuctionRemaining(75), '01:15');
  assert.equal(formatAuctionRemaining(9), '00:09');
  assert.equal(formatAuctionRemaining(-1), '00:00');
  assert.equal(
    auctionRemainingSeconds(auction.endTime, new Date(Date.parse(auction.endTime) + 1000)),
    0,
  );
  assert.equal(
    auctionRemainingSeconds(auction.endTime, new Date(Date.parse(auction.endTime) - 1)),
    1,
  );
  assert.equal(store.getState().getAuction(auction.id)?.status, 'IN_PROGRESS');
  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [390, 844],
  ]) {
    const scale = viewportScale(width, height, 1920, 1080);
    assert.ok(1920 * scale <= width && 1080 * scale <= height);
  }
});

test('runtime scene is exactly the embedded background PNG, excluding SVG text/buttons/header', () => {
  const runtime = readFileSync(new URL('../public/assets/auction/room-scene.png', import.meta.url));
  // Recorded from the source's image0 PNG, so CI does not need ignored design-reference files.
  assert.equal(
    createHash('sha256').update(runtime).digest('hex'),
    '4c60ebe8804b6fff58ac626f51185d172e3e0971b35e4ac0cd9d56e7b6ceeaa3',
  );
  assert.equal(runtime.readUInt32BE(16), 1920);
  assert.equal(runtime.readUInt32BE(20), 1080);
});
