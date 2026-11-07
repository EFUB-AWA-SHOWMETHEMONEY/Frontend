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
const { createMemberStore } = require('../src/stores/memberStore.ts');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
  };
}

test('bank and shop share one balance and restore the entire ledger together', async () => {
  const storage = memoryStorage();
  const store = createMemberStore(storage);
  assert.equal(store.getState().subscribeToBank('seed', 100, 3, 'early'), false);
  assert.deepEqual(store.getState().purchase('straw'), { ok: false, reason: 'not-ready' });
  await store.persist.rehydrate();
  assert.equal(store.getState().hydrated, true);
  assert.equal(store.getState().subscribeToBank('seed', 300, 3, 'deposit'), true);
  assert.equal(store.getState().balance, 700);
  assert.deepEqual(store.getState().purchase('straw'), { ok: true });
  assert.equal(store.getState().balance, 200);
  assert.equal(store.getState().subscribeToBank('seed', 300, 3, 'poor'), false);
  assert.deepEqual(store.getState().sell('owned-1'), { ok: true });
  assert.equal(store.getState().balance, 600);
  assert.equal(store.getState().subscribeToBank('moamoa', 100, 3, 'installment'), true);
  assert.equal(store.getState().balance, 500);
  assert.equal(store.getState().savings, 2900);
  const before = store.getState();
  assert.equal(store.getState().subscribeToBank('moamoa', 100, 3, 'installment'), false);
  assert.equal(store.getState(), before);

  const restored = createMemberStore(storage);
  await restored.persist.rehydrate();
  for (const field of ['balance', 'savings', 'subscriptions', 'inventory', 'nextInstanceId']) {
    assert.deepEqual(restored.getState()[field], store.getState()[field]);
  }
  assert.equal(restored.getState().subscribeToBank('seed', 300, 3, 'deposit'), false);
});

test('existing bank savings migrate once and never overwrite the shared ledger', async () => {
  const storage = memoryStorage();
  storage.setItem(
    'moamoa-bank-mock-v1',
    JSON.stringify({
      version: 1,
      state: { balance: 700, savings: 2800, subscriptions: [] },
    }),
  );
  const store = createMemberStore(storage);
  await store.persist.rehydrate();
  assert.equal(store.getState().balance, 700);
  assert.equal(store.getState().savings, 2800);
  assert.equal(store.getState().inventory.length, 2);
  assert.deepEqual(store.getState().purchase('straw'), { ok: true });
  const restored = createMemberStore(storage);
  await restored.persist.rehydrate();
  assert.equal(restored.getState().balance, 200);
  assert.equal(restored.getState().inventory.length, 3);
});

test('invalid amounts, terms and duplicate requests do not change the ledger', async () => {
  const store = createMemberStore(memoryStorage());
  await store.persist.rehydrate();
  const initial = store.getState();
  for (const args of [
    ['seed', 99, 3, 'small'],
    ['seed', -100, 3, 'negative'],
    ['seed', 100.5, 3, 'fraction'],
    ['seed', 100, 1, 'term'],
    ['seed', 100, 3, ''],
    ['unknown', 100, 3, 'unknown'],
    ['seed', NaN, 3, 'nan'],
    ['seed', Infinity, 3, 'infinite'],
  ]) {
    assert.equal(store.getState().subscribeToBank(...args), false);
    assert.equal(store.getState(), initial);
  }
  assert.equal(store.getState().subscribeToBank('seed', 1000, 12, 'all'), true);
  assert.equal(store.getState().balance, 0);
  assert.deepEqual(store.getState().purchase('straw'), { ok: false, reason: 'insufficient-funds' });
});

test('unreadable persisted state is not overwritten with a fresh balance', async () => {
  const storage = memoryStorage();
  storage.setItem('moamoa-member-mock-v1', 'invalid JSON');
  const store = createMemberStore(storage);
  await store.persist.rehydrate();
  assert.equal(store.getState().hydrated, false);
  assert.equal(storage.getItem('moamoa-member-mock-v1'), 'invalid JSON');
});
