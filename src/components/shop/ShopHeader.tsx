'use client';

import Header from '@/components/layout/Header';
import { usePathname } from 'next/navigation';
import { useShopStore } from '@/features/shop/useShopStore';
import styles from './Shop.module.css';

export default function ShopHeader({ nickname }: { nickname: string }) {
  const balance = useShopStore((state) => state.balance);
  const pathname = usePathname();
  return (
    <div className={pathname === '/shop' ? styles.responsiveHeader : undefined}>
      <Header nickname={nickname} balance={balance} />
    </div>
  );
}
