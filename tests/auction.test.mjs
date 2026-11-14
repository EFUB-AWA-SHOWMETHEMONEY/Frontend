import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};
const {
  auctionDate,
  auctionTimeOptions,
  validAuctionTime,
  parseAuctionPrice,
  auctionInventory,
  createMockAuction,
} = require('../src/utils/auction.ts');
const now = new Date('2026-11-14T14:00:00+09:00');
const member = { hydrated: true, inventory: [{ instanceId: 'owned-1', productId: 'ribbon' }] };
const input = {
  ownedItemInstanceId: 'owned-1',
  startingPrice: 1500,
  startTime: '2026-11-14T14:10:00+09:00',
  type: 'PUBLIC',
};

test('prices reject zero, signs, decimals, exponent notation and unsafe values without rounding', () => {
  for (const value of ['', '0', '-1', '+1', '1.5', '1e3', '1,000', 'abc', '9007199254740992'])
    assert.equal(parseAuctionPrice(value), null);
  assert.equal(parseAuctionPrice('1500'), 1500);
  assert.equal(parseAuctionPrice('9007199254740991'), Number.MAX_SAFE_INTEGER);
});

test('future ten-minute options use Seoul date and never wrap midnight', () => {
  assert.equal(auctionDate(new Date('2026-11-14T15:00:00Z')), '2026-11-15');
  assert.equal(auctionTimeOptions('2026-11-14', now)[0], '14:10');
  assert.equal(auctionTimeOptions('2026-11-14', new Date('2026-11-14T14:09:59+09:00'))[0], '14:10');
  assert.deepEqual(auctionTimeOptions('2026-11-14', new Date('2026-11-14T23:49:59+09:00')), [
    '23:50',
  ]);
  assert.deepEqual(auctionTimeOptions('2026-11-14', new Date('2026-11-14T23:50:00+09:00')), []);
  assert.deepEqual(auctionTimeOptions('2026-11-14', new Date('2026-11-15T00:00:00+09:00')), []);
});

test('time validation rejects elapsed, same instant, next-day and off-grid submissions', () => {
  for (const value of [
    '2026-11-14T13:50:00+09:00',
    '2026-11-14T14:00:00+09:00',
    '2026-11-15T00:10:00+09:00',
    '2026-11-14T14:15:00+09:00',
    '2026-11-14T24:00:00+09:00',
    '2026-11-14T14:10:01+09:00',
  ])
    assert.equal(validAuctionTime(value, now), false);
  assert.equal(validAuctionTime(input.startTime, now), true);
  assert.equal(validAuctionTime(input.startTime, new Date(input.startTime)), false);
});

test('inventory excludes missing products and keeps owned-instance identity', () => {
  const items = auctionInventory([
    ...member.inventory,
    { instanceId: 'missing', productId: 'unknown' },
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].instanceId, 'owned-1');
  assert.equal(items[0].product.name, '리본 헤어핀');
  assert.deepEqual(auctionInventory([]), []);
});

test('creation revalidates hydration, ownership, price, time and type before allocating an ID', () => {
  const id = () => {
    throw new Error('must not allocate ID on invalid request');
  };
  assert.equal(createMockAuction(input, { ...member, hydrated: false }, now, id).ok, false);
  assert.equal(createMockAuction(input, { ...member, inventory: [] }, now, id).ok, false);
  assert.equal(
    createMockAuction(
      input,
      { ...member, inventory: [{ instanceId: 'new-instance', productId: 'ribbon' }] },
      now,
      id,
    ).ok,
    false,
  );
  for (const patch of [
    { startingPrice: 0 },
    { startingPrice: 1.5 },
    { startingPrice: Infinity },
    { startingPrice: Number.MAX_SAFE_INTEGER + 1 },
    { startTime: '2026-11-14T14:00:00+09:00' },
    { type: 'INVALID' },
  ])
    assert.equal(createMockAuction({ ...input, ...patch }, member, now, id).ok, false);
});

test('creation preserves inventory, uses catalog identity, and creates distinct temporary auctions', () => {
  const before = structuredClone(member);
  Object.freeze(member.inventory[0]);
  Object.freeze(member.inventory);
  Object.freeze(member);
  const first = createMockAuction(input, member, now, () => 'unique-1');
  const second = createMockAuction(
    { ...input, type: 'PRIVATE', startingPrice: Number.MAX_SAFE_INTEGER },
    member,
    now,
    () => 'unique-2',
  );
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(first.auction.ownedItemInstanceId, 'owned-1');
  assert.equal(first.auction.itemName, '리본 헤어핀');
  assert.equal(first.auction.itemImage, '/assets/items/pixelated/ribbon-bow.svg');
  assert.equal(second.auction.type, 'PRIVATE');
  assert.notEqual(first.auction.id, second.auction.id);
  assert.deepEqual(member, before);
});
