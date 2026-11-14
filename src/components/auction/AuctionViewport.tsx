'use client';

import type { ReactNode } from 'react';
import { useScaledViewport } from '@/hooks/useScaledViewport';
import styles from './auction.module.css';

export default function AuctionViewport({ children }: { children: ReactNode }) {
  const { viewportRef, contentRef } = useScaledViewport({
    width: 1920,
    height: 1080,
    lockScroll: true,
  });
  return (
    <div ref={viewportRef} className={styles.viewport}>
      <div ref={contentRef} className={styles.canvas}>
        {children}
      </div>
    </div>
  );
}
