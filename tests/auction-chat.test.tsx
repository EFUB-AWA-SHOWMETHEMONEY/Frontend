import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createAuctionStore } from '../src/stores/auctionStore';
import { nearChatBottom, shouldSendChatKey, validAuctionChat } from '../src/utils/auctionChat';
import AuctionRoomChat from '../src/components/auction/AuctionRoomChat';

const input = {
  auctionId: 'auction-002',
  senderId: 'mock-member-001',
  senderName: '닉네임',
  content: ' 안녕하세요 ',
  requestId: 'request-1',
};

test('chat trims input, appends in order and isolates rooms across navigation; fresh store resets', () => {
  const store = createAuctionStore();
  const result = store.getState().sendChat(input);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.message.content, '안녕하세요');
  assert.equal(result.message.senderId, input.senderId);
  assert.equal(result.message.senderName, input.senderName);
  assert.ok(Number.isFinite(Date.parse(result.message.createdAt)));
  assert.equal(store.getState().getRoomData('auction-004', input.senderId)!.messages.length, 0);
  const leave = store.subscribe(() => {});
  leave();
  assert.equal(store.getState().getRoomData(input.auctionId, input.senderId)!.messages.length, 1);
  assert.equal(createAuctionStore().getState().messages.length, 0);
});

test('request deduplication also protects reentrant notifications, but same text with a new request is allowed', () => {
  const store = createAuctionStore();
  const unsubscribe = store.subscribe(() =>
    assert.equal(store.getState().sendChat(input).ok, false),
  );
  assert.equal(store.getState().sendChat(input).ok, true);
  unsubscribe();
  assert.equal(store.getState().sendChat(input).ok, false);
  assert.equal(store.getState().sendChat({ ...input, requestId: 'request-2' }).ok, true);
  assert.equal(store.getState().messages.length, 2);
  assert.equal(new Set(store.getState().messages.map((m) => m.messageId)).size, 2);
});

test('empty and over-limit text fail without mutation; exactly 100 code units succeed', () => {
  const store = createAuctionStore();
  for (const content of ['', ' \n\t ', '가'.repeat(101)]) {
    assert.equal(validAuctionChat(content), false);
    assert.equal(store.getState().sendChat({ ...input, content }).ok, false);
  }
  assert.equal(store.getState().sendChat({ ...input, content: '가'.repeat(100) }).ok, true);
  assert.equal(store.getState().messages.length, 1);
});

test('ended/missing rooms and published results block new messages without removing history', () => {
  const store = createAuctionStore();
  store.getState().sendChat(input);
  store.setState((s) => ({
    auctions: s.auctions.map((a) => (a.id === input.auctionId ? { ...a, status: 'ENDED' } : a)),
  }));
  assert.equal(store.getState().sendChat({ ...input, requestId: 'ended' }).ok, false);
  assert.equal(store.getState().sendChat({ ...input, auctionId: 'missing' }).ok, false);
  assert.equal(store.getState().messages.length, 1);
  store.setState({
    results: [
      {
        auctionId: 'auction-004',
        status: 'UNSOLD',
        winnerId: null,
        winningAmount: null,
        endedAt: new Date().toISOString(),
      },
    ],
  });
  assert.equal(
    store.getState().sendChat({ ...input, auctionId: 'auction-004', requestId: 'result' }).ok,
    false,
  );
});

test('Enter eligibility excludes IME composition and legacy 229; scroll follows only near bottom', () => {
  assert.equal(shouldSendChatKey('Enter', false, 13), true);
  assert.equal(shouldSendChatKey('Enter', true, 13), false);
  assert.equal(shouldSendChatKey('Enter', false, 229), false);
  assert.equal(shouldSendChatKey('a', false, 65), false);
  assert.equal(nearChatBottom(500, 132, 368), true);
  assert.equal(nearChatBottom(500, 132, 336), true);
  assert.equal(nearChatBottom(500, 132, 335), false);
});

test('ended chat preserves escaped history, original dimensions and disabled submission', () => {
  const store = createAuctionStore();
  store.getState().sendChat({ ...input, content: '<script>test</script>' });
  const html = renderToStaticMarkup(
    <AuctionRoomChat auctionId={input.auctionId} messages={store.getState().messages} ended />,
  );
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /닉네임/);
  assert.match(html, /h-\[132px\]/);
  assert.match(html, /w-\[600px\]/);
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /종료된 경매입니다/);
  assert.match(html, /<input[^>]*disabled=""/);
  assert.match(html, /<input[^>]*outline-none/);
  assert.match(html, /focus-within:ring-coral/);
  assert.match(html, /focus-within:ring-inset/);
  assert.match(html, /<button[^>]*disabled=""[^>]*type="submit"/);
});
