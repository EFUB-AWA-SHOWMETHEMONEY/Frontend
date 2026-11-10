'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { PLAZA_HEIGHT, PLAZA_WIDTH } from '@/types/socket';

const BOTTOM_GAP = 24;

export function usePlazaScale() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const fit = () => {
      const top = viewport.getBoundingClientRect().top + window.scrollY;
      const availableHeight = window.innerHeight - top - BOTTOM_GAP;
      const next = Math.min(viewport.clientWidth / PLAZA_WIDTH, availableHeight / PLAZA_HEIGHT);
      setScale(Math.max(0.5, next));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    window.addEventListener('resize', fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, []);

  return { viewportRef, scale };
}
