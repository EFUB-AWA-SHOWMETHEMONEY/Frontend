'use client';

import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useQuizStore } from '@/stores/quizStore';

export function useQuizSession() {
  const [session] = useState(() => Symbol('quiz mount'));
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      useQuizStore.getState().enter(session);
      initialized.current = true;
    }
    const tick = () => useQuizStore.getState().tick();
    const timer = window.setInterval(tick, 1000);
    window.addEventListener('storage', tick);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', tick);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [session]);
  return useQuizStore(
    useShallow((state) => ({
      screen: state.screen,
      remainingSeconds: state.screen === 'completed' ? state.remainingSeconds : 0,
      submit: state.submit,
      leave: state.leave,
      storageError: state.storageError,
      ready: state.ready && state.session === session,
    })),
  );
}
