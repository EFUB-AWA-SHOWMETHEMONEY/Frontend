'use client';

import { useLayoutEffect, useRef } from 'react';

interface ScaleOptions {
  width?: number;
  height?: number;
  belowHeader?: boolean;
  lockScroll?: boolean;
}

/** Fixed design dimensions or measured content, with an optional header offset. */
export function useScaledViewport({
  width,
  height,
  belowHeader = false,
  lockScroll = false,
}: ScaleOptions) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const header = belowHeader ? document.querySelector('header') : null;
    if (!viewport || !content || (belowHeader && !header)) return;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    if (lockScroll) {
      root.style.overflow = 'hidden';
      root.style.scrollbarGutter = 'auto';
    }
    const fit = () => {
      if (header) {
        viewport.style.top = `${header.getBoundingClientRect().bottom + Math.min(48, window.innerHeight * 0.04)}px`;
      }
      const scale = Math.max(
        0,
        Math.min(
          1,
          viewport.clientWidth / (width ?? content.offsetWidth),
          viewport.clientHeight / (height ?? content.offsetHeight),
        ),
      );
      content.style.transform = `translateX(-50%) scale(${scale})`;
      content.style.visibility = 'visible';
    };
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    observer.observe(content);
    if (header) observer.observe(header);
    window.addEventListener('resize', fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
      if (lockScroll) {
        root.style.overflow = previousOverflow;
        root.style.scrollbarGutter = previousGutter;
      }
    };
  }, [width, height, belowHeader, lockScroll]);

  return { viewportRef, contentRef };
}
