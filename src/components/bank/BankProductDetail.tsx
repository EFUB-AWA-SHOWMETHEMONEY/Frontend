'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Button from '@/components/common/Button';
import type { BankProduct } from '@/constants/bank';
import { estimateBankMaturity } from '@/utils/bank';

export default function BankProductDetail({
  product,
  onClose,
  onSubscribe,
  balance,
}: {
  product: BankProduct;
  onClose: () => void;
  onSubscribe: (amount: number, months: number) => void;
  balance: number;
}) {
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const fields = [
    ['상품 안내', product.details.guide],
    ['이자', product.details.interest],
    ['가입 조건', product.details.conditions],
    ['유의 사항', product.details.notes],
  ];
  const numericAmount = Number(amount);
  const months = Number(term);
  const validInteger =
    /^\d+$/.test(amount) && Number.isSafeInteger(numericAmount) && numericAmount > 0;
  const estimate = validInteger ? estimateBankMaturity(product, numericAmount, months) : null;
  const invalidAmount =
    amount !== '' &&
    (!validInteger || (product.minimumAmount !== null && numericAmount < product.minimumAmount));
  const insufficientFunds = validInteger && numericAmount > balance;
  const canSubscribe = estimate !== null && !insufficientFunds;
  const inputStatus = invalidAmount
    ? '금액은 ' +
      product.minimumAmount?.toLocaleString('ko-KR') +
      '코인 이상의 양의 정수로 입력해주세요.'
    : insufficientFunds
      ? '최초 납입액이 보유 화폐보다 많아요.'
      : !amount
        ? '금액을 입력해주세요.'
        : !term
          ? '만기 개월 수를 선택해주세요.'
          : canSubscribe
            ? '더미 가입이 가능해요. 최초 납입액만 mock 보유 화폐에서 저축액으로 이동해요.'
            : '입력 금액과 만기 조건을 확인해주세요.';

  return (
    <section
      aria-labelledby="bank-product-title"
      className="absolute top-[285px] left-[50px] h-[660px] w-[1820px] rounded-[20px] bg-ivory px-20 pt-10"
    >
      <h2
        ref={headingRef}
        id="bank-product-title"
        tabIndex={-1}
        className="text-[32px] leading-10 text-black outline-none"
      >
        {product.name}
      </h2>
      <dl className="mt-5 flex h-[428px] flex-col justify-between rounded-[20px] bg-cream p-8">
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xl leading-[25px] text-brown-muted">{label}</dt>
            <dd className="mt-2 text-2xl leading-[30px] text-brown-dark">{value ?? '확인 예정'}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-8 flex items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <label className="flex h-[60px] w-[240px] items-center gap-3 rounded-[20px] border-[3px] border-brown-muted bg-white px-4">
            <span className="sr-only">
              {product.kind === 'installment' ? '월 저축 금액' : '예치 금액'}
            </span>
            <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              aria-invalid={invalidAmount || insufficientFunds}
              aria-describedby="bank-input-status"
              onChange={(event) => setAmount(event.target.value)}
              placeholder={product.kind === 'deposit' ? '예치할 금액' : '매달 저축할 금액'}
              className="w-full min-w-0 bg-transparent text-2xl text-brown-dark outline-none placeholder:text-brown-muted focus-visible:ring-2 focus-visible:ring-brown-dark"
            />
          </label>
          <label className="relative">
            <span className="sr-only">만기 개월 수</span>
            <select
              value={term}
              aria-describedby="bank-input-status"
              onChange={(event) => setTerm(event.target.value)}
              className="h-[60px] w-[206px] appearance-none rounded-[20px] border-[3px] border-brown-muted bg-white pr-10 pl-4 text-2xl text-brown-dark focus-visible:outline-3 focus-visible:outline-brown-dark"
            >
              <option value="">만기 개월 수</option>
              {product.termMonths ? (
                product.termMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}개월
                  </option>
                ))
              ) : (
                <option value="pending">확인 예정</option>
              )}
            </select>
            <Image
              src="/assets/ui/bank-select-arrow.png"
              alt=""
              width={24}
              height={24}
              className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
            />
          </label>
          <p className="text-xl text-brown-muted" aria-live="polite">
            만기 시 약{' '}
            <span className="text-2xl text-brown-dark">
              {estimate === null ? '-' : estimate.toLocaleString('ko-KR') + '코인'}
            </span>
          </p>
        </div>
        <div className="flex gap-5">
          <Button size="close" variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button
            disabled={!canSubscribe}
            onClick={() => {
              if (canSubscribe) onSubscribe(numericAmount, months);
            }}
          >
            가입하기
          </Button>
        </div>
      </div>
      <p
        id="bank-input-status"
        role="status"
        className={`absolute bottom-4 left-20 text-base ${invalidAmount || insufficientFunds ? 'text-red' : 'text-brown-muted'}`}
      >
        {inputStatus}
      </p>
    </section>
  );
}
