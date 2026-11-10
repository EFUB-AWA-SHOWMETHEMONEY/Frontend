'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { PLAZA_HEIGHT, PLAZA_WIDTH } from '@/types/socket';

export function usePlazaScale() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    root.style.overflow = 'hidden';
    root.style.scrollbarGutter = 'auto';
    const fit = () => {
      setScale(Math.max(viewport.clientWidth / PLAZA_WIDTH, viewport.clientHeight / PLAZA_HEIGHT));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    fit();
    return () => {
      observer.disconnect();
      root.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;
    };
  }, []);

  return { viewportRef, scale };
}
