'use client';

import type { ReactNode } from 'react';
import { useScaledViewport } from '@/hooks/useScaledViewport';

export default function ShopViewport({ children }: { children: ReactNode }) {
  const { viewportRef, contentRef } = useScaledViewport({ belowHeader: true, lockScroll: true });

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
