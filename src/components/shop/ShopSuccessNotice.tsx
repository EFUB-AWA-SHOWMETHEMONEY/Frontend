'use client';

import Image from 'next/image';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { subjectParticle, type TransactionKind } from '@/utils/shopSuccessMessage';

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
    <div
      ref={noticeRef}
      className="pointer-events-none absolute top-[-12px] left-1/2 z-10 min-h-[94px] w-max min-w-[551px] -translate-x-1/2 px-5 pt-[15px] pb-[25px] text-2xl leading-7 text-white [@media(width<1024px),(height<600px)]:fixed [@media(width<1024px),(height<600px)]:top-2 [@media(width<1024px),(height<600px)]:[zoom:min(1,calc((100vw-16px)/var(--notice-width,551px)))]"
      role="status"
      aria-atomic="true"
    >
      <div className="flex min-h-[54px] flex-nowrap items-center justify-center gap-0 rounded-[27px] border-[3px] border-brown-dark bg-brown-dark px-6 py-2.5 shadow-[0_5px_20px_rgb(0_0_0/10%)] [&_img]:shrink-0">
        <span className="mr-3 shrink-0 tracking-[-0.25px] whitespace-nowrap">
          <span>
            {notice.itemName.trim()}
            {subjectParticle(notice.itemName)}
          </span>{' '}
          <span>성공적으로 {notice.kind === 'purchase' ? '구매' : '판매'}되었어요!</span>
        </span>
        <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
        <span className="shrink-0 text-xl whitespace-nowrap">
          {notice.kind === 'purchase' ? '−' : '+'}
          {notice.amount.toLocaleString('ko-KR')}
        </span>
      </div>
    </div>
  );
}
