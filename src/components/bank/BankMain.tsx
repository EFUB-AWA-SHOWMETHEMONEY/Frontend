'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Button from '@/components/common/Button';
import { bankAccount, bankProductGroups, type BankProduct } from '@/constants/bank';
import BankViewport from './BankViewport';
import BankProductDetail from './BankProductDetail';
import BankCompletionPreview from './BankCompletionPreview';
import { bankStore } from '@/stores/bankStore';

export default function BankMain() {
  const router = useRouter();
  const [selectedProduct, setSelectedProduct] = useState<BankProduct | null>(null);
  const [completionPreview, setCompletionPreview] = useState(false);
  const {
    balance,
    savings,
    subscriptions: mockSubscriptions,
    hydrated,
    subscribe,
  } = useStore(bankStore);
  const requestIdRef = useRef('');
  useEffect(() => {
    void bankStore.persist.rehydrate();
  }, []);
  return (
    <BankViewport modalOpen={completionPreview}>
      {/* Keep Header's desktop layout inside the scaled 1920px frame. */}
      <div className="flow-root [&>header]:mx-[50px]! [&>header]:h-[88px]! [&>header]:grid-cols-[minmax(0,1fr)_166px_minmax(0,1fr)]! [&>header]:gap-y-0! [&>header]:px-[47px]! [&>header]:py-0! [&>header>div]:col-auto! [&>header>div]:row-auto! [&>header>img]:col-auto! [&>header>img]:row-auto!">
        <Header nickname={bankAccount.nickname} balance={balance} />
      </div>
      <main>
        <h1 className="absolute top-[176px] left-[65px] text-[40px] leading-[61px] text-black [-webkit-text-stroke:16px_#FFFDF9] [paint-order:stroke_fill]">
          은행
        </h1>
        <div
          className="absolute top-[190px] right-[70px] flex items-center gap-5 text-[28px] leading-[35px] text-black"
          aria-label={`저축액 ${savings.toLocaleString('ko-KR')}`}
        >
          <span className="bg-transparent text-white">저축액</span>
          <span className="relative isolate flex items-center gap-5 before:absolute before:-inset-x-3 before:-inset-y-1 before:-z-10 before:rounded-full before:bg-white">
            <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
            <span>{savings.toLocaleString('ko-KR')}</span>
          </span>
        </div>
        {selectedProduct ? (
          <BankProductDetail
            key={selectedProduct.id}
            product={selectedProduct}
            balance={balance}
            onSubscribe={(amount, months) => {
              if (completionPreview) return;
              if (!subscribe(selectedProduct.id, amount, months, requestIdRef.current)) return;
              setCompletionPreview(true);
            }}
            onClose={() => {
              setSelectedProduct(null);
              requestAnimationFrame(() =>
                document.getElementById(`bank-join-${selectedProduct.id}`)?.focus(),
              );
            }}
          />
        ) : (
          <div className="absolute top-[285px] left-[50px] h-[632px] w-[1820px] rounded-[20px] bg-ivory px-20 pt-10">
            {bankProductGroups.map((group, index) => (
              <section
                key={group.id}
                aria-labelledby={`bank-${group.id}`}
                className={index === 0 ? '' : 'mt-[43px]'}
              >
                <h2 id={`bank-${group.id}`} className="text-[32px] leading-10 text-black">
                  {group.title}
                </h2>
                <ul className="mt-5 flex flex-col gap-5">
                  {group.products.map((product) => (
                    <li
                      key={product.id}
                      className="flex h-[86px] items-center gap-6 rounded-[20px] border-[3px] border-brown-muted bg-white px-5"
                    >
                      <h3 className="w-[180px] shrink-0 text-[28px] leading-[35px] text-black">
                        {product.name}
                      </h3>
                      <p className="min-w-0 flex-1 text-2xl leading-[30px] text-brown-muted">
                        {product.description}
                      </p>
                      <Button
                        size="close"
                        id={`bank-join-${product.id}`}
                        aria-label={`${product.name} 가입`}
                        disabled={!hydrated}
                        onClick={() => {
                          requestIdRef.current = crypto.randomUUID();
                          setSelectedProduct(product);
                        }}
                        className="bg-[#FFCC42]! text-brown-dark!"
                      >
                        가입
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        <div className="absolute top-[975px] left-[660px]">
          <Button size="exit" variant="secondary" onClick={() => router.push('/')}>
            <span className="inline-flex items-center justify-center gap-[0.25em]">
              <Image src="/assets/ui/arrow-left.svg" alt="" width={32} height={32} />
              <span>은행 나가기</span>
            </span>
          </Button>
        </div>
      </main>
      {selectedProduct && mockSubscriptions.length > 0 && (
        <BankCompletionPreview
          isOpen={completionPreview}
          productName={mockSubscriptions[mockSubscriptions.length - 1].productName}
          onConfirm={() => {
            const productId = selectedProduct.id;
            setCompletionPreview(false);
            setSelectedProduct(null);
            requestAnimationFrame(() => document.getElementById(`bank-join-${productId}`)?.focus());
          }}
        />
      )}
    </BankViewport>
  );
}
