'use client';

import { useEffect, useState } from 'react';

const MAX_FAKE_PROGRESS = 90;
const TICK_MS = 100;

export default function useFakeProgress(isDone = false) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isDone) return;
    const timer = setInterval(() => {
      setProgress((prev) => prev + (MAX_FAKE_PROGRESS - prev) * 0.08);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isDone]);

  return isDone ? 100 : Math.round(progress);
}
