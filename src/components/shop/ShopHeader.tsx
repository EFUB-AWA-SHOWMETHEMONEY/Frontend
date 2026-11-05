'use client';

import Header from '@/components/layout/Header';
import { usePathname } from 'next/navigation';
import { useShopStore } from '@/hooks/useShopStore';

export default function ShopHeader({ nickname }: { nickname: string }) {
  const balance = useShopStore((state) => state.balance);
  const pathname = usePathname();
  return (
    <div
      className={
        pathname === '/shop'
          ? 'contents max-sm:[&>header]:grid-cols-[minmax(0,1fr)] max-sm:[&>header>div]:justify-self-start max-sm:[&>header>img]:col-start-1 max-sm:[&>header>img]:col-end-2'
          : undefined
      }
    >
      <Header nickname={nickname} balance={balance} />
    </div>
  );
}
