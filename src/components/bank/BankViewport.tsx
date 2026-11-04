'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Scale the fixed Figma frame, never the variable content height. */
export default function BankViewport({
  children,
  modalOpen = false,
}: {
  children: ReactNode;
  modalOpen?: boolean;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const frame = frameRef.current;
    if (!viewport || !frame) return;
    const fit = () => {
      const scale = Math.min(1, viewport.clientWidth / 1920, viewport.clientHeight / 1080);
      frame.style.transform = `translateX(-50%) scale(${scale})`;
      frame.style.visibility = 'visible';
    };
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    fit();
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={viewportRef}
      className={`fixed inset-0 overflow-hidden bg-cover bg-center bg-no-repeat ${modalOpen ? "bg-[url('/assets/backgrounds/bank-bg.svg')]" : "bg-[linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.3)),url('/assets/backgrounds/bank-bg.svg')]"}`}
    >
      <div
        ref={frameRef}
        className="invisible absolute top-0 left-1/2 h-[1080px] w-[1920px] origin-top font-jua"
      >
        {children}
      </div>
    </div>
  );
}
