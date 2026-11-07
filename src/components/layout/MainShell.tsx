'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from 'zustand';
import Header from './Header';
import BankViewport from '@/components/bank/BankViewport';
import { hydrateMemberStore, memberStore } from '@/stores/memberStore';

export default function MainShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const nickname = useStore(memberStore, (state) => state.nickname);
  const balance = useStore(memberStore, (state) => state.balance);
  useEffect(() => {
    void hydrateMemberStore();
  }, []);

  const header = <Header nickname={nickname} balance={balance} />;
  if (pathname === '/bank') {
    return (
      <BankViewport>
        <div className="flow-root [&>header]:mx-[50px]! [&>header]:h-[88px]! [&>header]:grid-cols-[minmax(0,1fr)_166px_minmax(0,1fr)]! [&>header]:gap-y-0! [&>header]:px-[47px]! [&>header]:py-0! [&>header>div]:col-auto! [&>header>div]:row-auto! [&>header>img]:col-auto! [&>header>img]:row-auto!">
          {header}
        </div>
        <main>{children}</main>
      </BankViewport>
    );
  }
  return (
    <>
      <div
        className={
          pathname === '/shop'
            ? 'contents max-sm:[&>header]:grid-cols-[minmax(0,1fr)] max-sm:[&>header>div]:justify-self-start max-sm:[&>header>img]:col-start-1 max-sm:[&>header>img]:col-end-2'
            : undefined
        }
      >
        {header}
      </div>
      <main>{children}</main>
    </>
  );
}
