'use client';

import { useEffect, useRef } from 'react';
import { useQuizStore } from '@/stores/quizStore';

export function useQuizSession() {
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      useQuizStore.getState().enter();
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
  }, []);
  return useQuizStore();
}
