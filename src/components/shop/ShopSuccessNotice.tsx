'use client';

import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { subjectParticle, type TransactionKind } from '@/features/shop/success-message';
import styles from './Shop.module.css';

export interface ShopNotice {
  id: number;
  kind: TransactionKind;
  itemName: string;
  amount: number;
}

/** Mount with key={notice.id}: each successful transaction owns one 5s timer. */
export default function ShopSuccessNotice({ notice }: { notice: ShopNotice }) {
  const [visible, setVisible] = useState(true);
  const noticeRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const element = noticeRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      element.style.setProperty('--notice-width', `${element.offsetWidth}px`);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 5000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return (
    <div ref={noticeRef} className={styles.notice} role="status" aria-atomic="true">
      <div className={styles.noticeCapsule}>
        <span className={styles.noticeMessage}>
          <span>
            {notice.itemName.trim()}
            {subjectParticle(notice.itemName)}
          </span>{' '}
          <span>성공적으로 {notice.kind === 'purchase' ? '구매' : '판매'}되었어요!</span>
        </span>
        <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
        <span className={styles.noticeAmount}>
          {notice.kind === 'purchase' ? '−' : '+'}
          {notice.amount.toLocaleString('ko-KR')}
        </span>
      </div>
    </div>
  );
}
