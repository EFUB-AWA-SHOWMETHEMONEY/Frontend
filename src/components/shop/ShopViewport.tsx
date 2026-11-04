'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Fit the complete shop below the header, including pagination and the exit button. */
export default function ShopViewport({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const header = document.querySelector('header');
    if (!viewport || !content || !header) return;

    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    const previousGutter = root.style.scrollbarGutter;
    root.style.overflow = 'hidden';
    // This page never scrolls: don't reserve a gutter that Modal's body lock can change.
    root.style.scrollbarGutter = 'auto';

    const fit = () => {
      const headerBottom = header.getBoundingClientRect().bottom;
      const gap = Math.min(48, window.innerHeight * 0.04);
      viewport.style.top = `${headerBottom + gap}px`;
      // offset sizes exclude the transform, so resizing cannot compound the scale.
      const scale = Math.max(
        0,
        Math.min(
          1,
          viewport.clientWidth / content.offsetWidth,
          viewport.clientHeight / content.offsetHeight,
        ),
      );
      content.style.transform = `translateX(-50%) scale(${scale})`;
      content.style.visibility = 'visible';
    };

    const observer = new ResizeObserver(fit);
    observer.observe(header);
    observer.observe(viewport);
    observer.observe(content);
    window.addEventListener('resize', fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
      root.style.overflow = previousOverflow;
      root.style.scrollbarGutter = previousGutter;
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[url('/assets/backgrounds/shop-bg.svg')] bg-cover bg-center bg-no-repeat"
      />
      <div ref={viewportRef} className="fixed inset-x-0 bottom-0 overflow-hidden">
        <div
          ref={contentRef}
          className="invisible absolute top-0 left-1/2 flow-root w-[1920px] origin-top max-lg:w-[768px]"
        >
          {children}
        </div>
      </div>
    </>
  );
}
