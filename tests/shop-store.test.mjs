import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import test from 'node:test';
import ts from 'typescript';

// Run the actual TS store with Node's test runner, without adding a test dependency.
const require = createRequire(import.meta.url);
require.extensions['.ts'] = (module, filename) => {
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(outputText, filename);
};
const { createShopStore } = require('../src/features/shop/store.ts');
const { shopProducts } = require('../src/features/shop/catalog.ts');
const { successMessage, subjectParticle } = require('../src/features/shop/success-message.ts');

test('eight products use existing SVGs and known Figma prices', () => {
  assert.equal(shopProducts.length, 8);
  assert.equal(new Set(shopProducts.map((item) => item.id)).size, 8);
  for (const item of shopProducts) {
    assert.ok(existsSync(resolve('public', decodeURIComponent(item.image.slice(1)))));
    assert.equal(item.salePrice, item.purchasePrice);
  }
  assert.deepEqual(
    shopProducts.slice(0, 5).map((item) => item.purchasePrice),
    [500, 1100, 400, 1200, 900],
  );
});

test('purchase deducts balance, adds inventory, and notifies balance subscribers', () => {
  const store = createShopStore();
  const balances = [];
  const unsubscribe = store.subscribe((state) => balances.push(state.balance));
  assert.deepEqual(store.getState().purchase('straw'), { ok: true });
  assert.equal(store.getState().balance, 500);
  assert.equal(store.getState().inventory.length, 3);
  assert.ok(store.getState().inventory.some((item) => item.productId === 'straw'));
  assert.deepEqual(balances, [500]);
  unsubscribe();
});

test('insufficient funds and duplicate purchase leave state untouched', () => {
  const store = createShopStore();
  const initial = store.getState();
  assert.deepEqual(initial.purchase('crown'), { ok: false, reason: 'insufficient-funds' });
  assert.equal(store.getState(), initial);
  assert.deepEqual(initial.purchase('ribbon'), { ok: false, reason: 'already-owned' });
  assert.equal(store.getState(), initial);
});

test('selling credits balance, removes ownership, and cannot be repeated', () => {
  const store = createShopStore();
  assert.deepEqual(store.getState().sell('owned-1'), { ok: true });
  assert.equal(store.getState().balance, 1400);
  assert.deepEqual(
    store.getState().inventory.map((item) => item.productId),
    ['sun'],
  );
  const afterSale = store.getState();
  assert.deepEqual(afterSale.sell('owned-1'), { ok: false, reason: 'not-found' });
  assert.equal(store.getState(), afterSale);
  assert.deepEqual(afterSale.purchase('ribbon'), { ok: true });
  assert.equal(store.getState().balance, 1000);
  assert.ok(
    store
      .getState()
      .inventory.some((item) => item.productId === 'ribbon' && item.instanceId !== 'owned-1'),
  );
});

test('selling all items produces an empty inventory; new store resets mock state', () => {
  const store = createShopStore();
  for (const item of [...store.getState().inventory]) store.getState().sell(item.instanceId);
  assert.deepEqual(store.getState().inventory, []);
  assert.equal(store.getState().balance, 2300);
  assert.equal(createShopStore().getState().balance, 1000);
  assert.equal(createShopStore().getState().inventory.length, 2);
});

test('success messages share final-syllable subject particles', () => {
  for (const name of ['리본', '왕관', '천사 링', '천사 링  '])
    assert.equal(subjectParticle(name), '이');
  assert.equal(subjectParticle('밀짚모자'), '가');
  assert.equal(successMessage('천사 링', 'purchase'), '천사 링이 성공적으로 구매되었어요!');
  assert.equal(successMessage('리본 헤어핀', 'sale'), '리본 헤어핀이 성공적으로 판매되었어요!');
  assert.equal(successMessage('밀짚모자', 'purchase'), '밀짚모자가 성공적으로 구매되었어요!');
});

test('exact balance purchase reaches zero and invalid IDs cannot change state', () => {
  const store = createShopStore();
  store.setState({ balance: 500 });
  assert.deepEqual(store.getState().purchase('straw'), { ok: true });
  assert.equal(store.getState().balance, 0);
  const state = store.getState();
  assert.deepEqual(state.purchase('invalid'), { ok: false, reason: 'not-found' });
  assert.deepEqual(state.sell('invalid'), { ok: false, reason: 'not-found' });
  assert.equal(store.getState(), state);
});
