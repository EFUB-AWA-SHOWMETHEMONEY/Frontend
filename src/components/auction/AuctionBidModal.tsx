'use client';

import { useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { useStore } from 'zustand';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { auctionStore } from '@/stores/auctionStore';
import { memberStore } from '@/stores/memberStore';
import { viewportScale } from '@/utils/viewport';
import { formatBidInput, validateAuctionBid } from '@/utils/auctionBid';

export default function AuctionBidModal({
  auctionId,
  bidderId,
  now,
  onClose,
  onSuccess,
}: {
  auctionId: string;
  bidderId: string;
  now: Date;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const auction = useStore(auctionStore, (state) =>
    state.auctions.find((entry) => entry.id === auctionId),
  );
  const balance = useStore(memberStore, (state) => state.balance);
  const hydrated = useStore(memberStore, (state) => state.hydrated);
  const [value, setValue] = useState('');
  const [failure, setFailure] = useState<{ message: string; snapshot: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submitted = useRef(false);
  const requestId = useRef<string | null>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const formId = useId();
  const inputId = useId();
  const errorId = useId();
  const validation = validateAuctionBid(auction, value, { balance, hydrated }, now);
  const snapshot = `${auction?.version}:${balance}:${hydrated}:${value}`;
  const error = validation.ok
    ? failure?.snapshot === snapshot
      ? failure.message
      : ''
    : validation.message;
  const isPrivate = auction?.type === 'PRIVATE';
  const height = isPrivate ? (error ? 566 : 472) : error ? 534 : 446;
  const hasHighest = auction?.type === 'PUBLIC' && auction.highestBid !== null;

  useLayoutEffect(() => {
    const fit = () =>
      wrapper.current?.style.setProperty(
        '--modal-scale',
        String(viewportScale(document.documentElement.clientWidth, window.innerHeight, 1920, 1080)),
      );
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitted.current || !validation.ok) return;
    submitted.current = true;
    setSubmitting(true);
    requestId.current ??= crypto.randomUUID();
    const result = auctionStore
      .getState()
      .submitBid({ auctionId, bidderId, requestId: requestId.current, value }, () =>
        memberStore.getState(),
      );
    if (!result.ok) {
      submitted.current = false;
      setSubmitting(false);
      setFailure({ message: result.message, snapshot });
      return;
    }
    onSuccess();
  }

  return (
    <div
      ref={wrapper}
      style={
        {
          '--modal-scale': 1,
          '--bid-top': `${(1080 - height) / 2}px`,
          '--bid-height': `${height}px`,
        } as CSSProperties
      }
    >
      <Modal
        isOpen
        onClose={onClose}
        title="입찰하기"
        className="inset-auto! top-[calc(var(--bid-top)*var(--modal-scale))]! left-[calc(50vw-400px*var(--modal-scale))]! m-0! h-[var(--bid-height)]! max-h-none! w-[800px]! max-w-none! origin-top-left scale-[var(--modal-scale)] overflow-visible! p-10! [&>div:last-child]:absolute [&>div:last-child]:right-10 [&>div:last-child]:bottom-10 [&>h2]:absolute [&>h2]:top-10 [&>h2]:left-10"
        actions={
          <Button
            variant="bank"
            type="submit"
            form={formId}
            disabled={!validation.ok || submitting}
          >
            입찰하기
          </Button>
        }
      >
        <form id={formId} onSubmit={submit}>
          {isPrivate && (
            <p className="absolute top-[86px] left-10 text-xl text-brown-muted">
              여러 번 입찰할 수 있고, 가장 최근에 낸 금액이 유효해요.
            </p>
          )}
          <dl
            className={`absolute right-10 left-10 flex h-[110px] flex-col justify-center gap-2 rounded-[20px] bg-cream px-5 ${isPrivate ? 'top-[140px]' : 'top-[108px]'}`}
          >
            <div className="flex items-center justify-between">
              <dt className="text-xl text-brown-muted">{hasHighest ? '현재 최고가' : '시작가'}</dt>
              <dd className="text-2xl">
                {(hasHighest ? auction?.highestBid : auction?.startingPrice)?.toLocaleString(
                  'ko-KR',
                ) ?? '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-xl text-brown-muted">보유 화폐</dt>
              <dd className="text-2xl">
                {hydrated ? balance.toLocaleString('ko-KR') : '불러오는 중'}
              </dd>
            </div>
          </dl>
          <label htmlFor={inputId} className="sr-only">
            입찰 금액
          </label>
          <div
            className={`absolute right-10 left-10 flex h-[66px] items-center gap-4 rounded-[15px] border-[3px] border-brown-muted px-5 focus-within:border-brown-dark ${isPrivate ? 'top-[280px]' : 'top-[248px]'}`}
          >
            <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
            <input
              id={inputId}
              autoFocus
              inputMode="numeric"
              autoComplete="off"
              maxLength={64}
              value={value}
              onChange={(event) => {
                setValue(formatBidInput(event.target.value));
                setFailure(null);
              }}
              placeholder="예) 1,500"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              className="min-w-0 flex-1 bg-transparent text-[32px] text-brown-dark outline-none placeholder:text-xl placeholder:text-brown-muted"
            />
          </div>
          {error && (
            <p
              id={errorId}
              role="alert"
              className={`absolute right-10 left-10 flex min-h-[54px] items-center rounded-[10px] border-2 border-red bg-red-light px-5 text-xl text-red ${isPrivate ? 'top-[374px]' : 'top-[342px]'}`}
            >
              {error}
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
