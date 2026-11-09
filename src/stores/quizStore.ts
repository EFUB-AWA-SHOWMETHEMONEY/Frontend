import { create } from 'zustand';
import { dailyQuiz } from '../constants/quiz';

export type QuizScreen = 'question' | 'correct' | 'incorrect' | 'completed';
export type QuizAnswer = 'O' | 'X';
export interface QuizParticipation {
  date: string;
  answer: QuizAnswer;
  correct: boolean;
  rewarded: boolean;
}

// Demo UI persistence only: this is NOT a user/account security or reward ledger.
// Development reset: localStorage.removeItem('moamoa-quiz-demo-v1'), then reload.
export const QUIZ_STORAGE_KEY = 'moamoa-quiz-demo-v1';
const RESULT_ENTRY_KEY = 'moamoaQuizResult';

export function localDate(now: Date) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function secondsUntilMidnight(now: Date) {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, Math.ceil((midnight.getTime() - now.getTime()) / 1000));
}

export function formatCountdown(seconds: number) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(Math.floor(seconds / 3600))}h ${pad(Math.floor((seconds % 3600) / 60))}m ${pad(seconds % 60)}s`;
}

function readParticipation(date: string): QuizParticipation | null {
  try {
    const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw) as QuizParticipation;
    if (
      record.date !== date ||
      (record.answer !== 'O' && record.answer !== 'X') ||
      record.correct !== (record.answer === dailyQuiz.answer) ||
      record.rewarded !== true
    ) {
      localStorage.removeItem(QUIZ_STORAGE_KEY);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

function rememberResult(record: QuizParticipation | null) {
  // Keep Next's router state intact. This marker belongs to this history entry,
  // so refreshing a result can retain it without treating a new visit as a result.
  window.history.replaceState(
    { ...window.history.state, [RESULT_ENTRY_KEY]: record },
    '',
    window.location.href,
  );
}

interface QuizState {
  screen: QuizScreen;
  record: QuizParticipation | null;
  date: string;
  remainingSeconds: number;
  ready: boolean;
  storageError: string | null;
  enter: () => void;
  tick: () => void;
  submit: (answer: QuizAnswer) => void;
  leave: () => void;
}

let enteredThisDocument = false;

export const useQuizStore = create<QuizState>((set, get) => ({
  screen: 'question',
  record: null,
  date: '',
  remainingSeconds: 0,
  ready: false,
  storageError: null,
  enter: () => {
    const now = new Date();
    const date = localDate(now);
    const record = readParticipation(date);
    const entry = window.history.state?.[RESULT_ENTRY_KEY] as QuizParticipation | undefined;
    const navigation = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    const restoreResult =
      !enteredThisDocument &&
      navigation?.type === 'reload' &&
      record &&
      entry?.date === date &&
      entry.answer === record.answer;
    enteredThisDocument = true;
    if (!restoreResult) rememberResult(null);
    set({
      date,
      record,
      ready: true,
      storageError: null,
      remainingSeconds: secondsUntilMidnight(now),
      screen: record
        ? restoreResult
          ? record.correct
            ? 'correct'
            : 'incorrect'
          : 'completed'
        : 'question',
    });
  },
  tick: () => {
    const now = new Date();
    const date = localDate(now);
    const state = get();
    const record = readParticipation(date);
    if (date !== state.date) {
      rememberResult(null);
      set({ date, record, screen: record ? 'completed' : 'question', storageError: null });
    } else if (JSON.stringify(record) !== JSON.stringify(state.record)) {
      // Synchronize other tabs; never add reward amounts to the member ledger.
      set({ record, screen: record ? 'completed' : 'question' });
    }
    set({ remainingSeconds: secondsUntilMidnight(now) });
  },
  submit: (answer) => {
    const state = get();
    if (!state.ready || state.screen !== 'question') return;
    const now = new Date();
    const date = localDate(now);
    const existing = readParticipation(date);
    if (existing) {
      set({ date, record: existing, screen: 'completed' });
      return;
    }
    const record: QuizParticipation = {
      date,
      answer,
      correct: answer === dailyQuiz.answer,
      rewarded: true,
    };
    try {
      // Record once, then derive the demo balance from it (never increment).
      localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(record));
    } catch {
      set({
        storageError: '참여 기록을 저장할 수 없어요. 브라우저 저장 공간 설정을 확인해주세요.',
      });
      return;
    }
    rememberResult(record);
    set({ date, record, screen: record.correct ? 'correct' : 'incorrect', storageError: null });
  },
  leave: () => {
    rememberResult(null);
    set({ screen: get().record ? 'completed' : 'question' });
  },
}));
