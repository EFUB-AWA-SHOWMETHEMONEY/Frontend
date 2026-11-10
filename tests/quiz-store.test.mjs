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
const loadStore = () => {
  delete require.cache[require.resolve('../src/stores/quizStore.ts')];
  return require('../src/stores/quizStore.ts');
};

function browser(t) {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const history = {
    state: { __NA: true },
    replaceState(state) {
      this.state = state;
    },
  };
  for (const [key, value] of Object.entries({
    localStorage: storage,
    window: { history, location: { href: '/quiz' } },
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() =>
      original ? Object.defineProperty(globalThis, key, original) : delete globalThis[key],
    );
  }
  return { storage, history };
}

test('O and X each persist one reward; repeated submissions cannot overwrite it', (t) => {
  browser(t);
  for (const answer of ['O', 'X']) {
    const { useQuizStore: store, QUIZ_STORAGE_KEY: key } = loadStore();
    localStorage.removeItem(key);
    store.getState().enter();
    store.getState().submit(answer);
    const saved = localStorage.getItem(key);
    store.getState().submit(answer === 'O' ? 'X' : 'O');
    assert.equal(localStorage.getItem(key), saved);
    assert.equal(store.getState().record.rewarded, true);
    assert.equal(store.getState().record.reward, answer === 'O' ? 100 : 10);
    assert.equal(store.getState().totalRewards, answer === 'O' ? 100 : 10);
    assert.equal(store.getState().screen, answer === 'O' ? 'correct' : 'incorrect');
    const restored = loadStore().useQuizStore;
    restored.getState().enter();
    assert.equal(restored.getState().screen, 'completed');
    assert.equal(restored.getState().totalRewards, answer === 'O' ? 100 : 10);
    restored.getState().submit(answer);
    assert.equal(localStorage.getItem(key), saved);
  }
});

test('reload retains the result, but reentry and subsequent reload retain completed', (t) => {
  const { history } = browser(t);
  t.mock.method(performance, 'getEntriesByType', () => [{ type: 'reload' }]);
  let { useQuizStore: store } = loadStore();
  store.getState().enter();
  store.getState().submit('O');
  ({ useQuizStore: store } = loadStore());
  store.getState().enter();
  assert.equal(store.getState().screen, 'correct');
  store.getState().enter();
  assert.equal(store.getState().screen, 'completed');
  assert.equal(history.state.__NA, true);
  ({ useQuizStore: store } = loadStore());
  store.getState().enter();
  assert.equal(store.getState().screen, 'completed');
});

test('midnight resets participation but preserves rewards across days and reloads', (t) => {
  browser(t);
  const { useQuizStore: store, QUIZ_STORAGE_KEY: key } = loadStore();
  localStorage.setItem(key, '{broken');
  store.getState().enter();
  assert.equal(store.getState().screen, 'question');
  store.getState().submit('O');
  const yesterday = { ...store.getState().record, date: '2000-01-01' };
  localStorage.setItem(key, JSON.stringify(yesterday));
  store.setState({ date: yesterday.date, record: yesterday });
  store.getState().tick();
  assert.equal(store.getState().screen, 'question');
  assert.equal(store.getState().record, null);
  assert.equal(store.getState().totalRewards, 100);
  assert.notEqual(localStorage.getItem(key), null);
  store.getState().submit('X');
  assert.equal(store.getState().totalRewards, 110);
  const restored = loadStore().useQuizStore;
  restored.getState().enter();
  assert.equal(restored.getState().screen, 'completed');
  assert.equal(restored.getState().totalRewards, 110);
});

test('legacy O/X records retain participation with the corresponding reward', (t) => {
  browser(t);
  for (const answer of ['O', 'X']) {
    const { useQuizStore: store, QUIZ_STORAGE_KEY: key, localDate } = loadStore();
    localStorage.setItem(
      key,
      JSON.stringify({
        date: localDate(new Date()),
        answer,
        correct: answer === 'O',
        rewarded: true,
      }),
    );
    store.getState().enter();
    assert.equal(store.getState().screen, 'completed');
    assert.equal(store.getState().totalRewards, answer === 'O' ? 100 : 10);
  }
});

test('duplicated saved attempts cannot multiply the same daily reward', (t) => {
  browser(t);
  const { useQuizStore: store, QUIZ_STORAGE_KEY: key } = loadStore();
  store.getState().enter();
  store.getState().submit('O');
  const record = store.getState().record;
  localStorage.setItem(key, JSON.stringify({ version: 2, attempts: [record, record] }));
  store.getState().tick();
  assert.equal(store.getState().totalRewards, 100);
});

test('storage failure does not claim that a reward was paid', (t) => {
  const { storage } = browser(t);
  const { useQuizStore: store } = loadStore();
  store.getState().enter();
  t.mock.method(storage, 'setItem', () => {
    throw new Error('quota');
  });
  store.getState().submit('X');
  assert.equal(store.getState().screen, 'question');
  assert.equal(store.getState().record, null);
  assert.ok(store.getState().storageError);
});

test('countdown uses the next local calendar midnight including month rollover', () => {
  const { localDate, secondsUntilMidnight, formatCountdown } = loadStore();
  assert.equal(localDate(new Date(2026, 10, 30, 23, 59, 59)), '2026-11-30');
  assert.equal(secondsUntilMidnight(new Date(2026, 10, 30, 23, 59, 59)), 1);
  assert.equal(
    formatCountdown(secondsUntilMidnight(new Date(2026, 10, 8, 16, 38, 17))),
    '07h 21m 43s',
  );
});
