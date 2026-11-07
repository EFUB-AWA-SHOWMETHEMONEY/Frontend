'use client';

import type { ReactNode } from 'react';
import { useScaledViewport } from '@/hooks/useScaledViewport';

export default function BankViewport({ children }: { children: ReactNode }) {
  const { viewportRef, contentRef } = useScaledViewport({ width: 1920, height: 1080 });

  return (
    <div
      ref={viewportRef}
      className="fixed inset-0 overflow-hidden bg-[linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.3)),url('/assets/backgrounds/bank-bg.svg')] bg-cover bg-center bg-no-repeat has-[dialog[open]]:bg-[url('/assets/backgrounds/bank-bg.svg')]"
    >
      <div
        ref={contentRef}
        className="invisible absolute top-0 left-1/2 h-[1080px] w-[1920px] origin-top font-jua"
      >
        {children}
      </div>
    </div>
  );
}
