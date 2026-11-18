'use client';

import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { MockAuction, MockAuctionResult } from '@/types/auctionMock';
import { viewportScale } from '@/utils/viewport';

export default function AuctionResultModal({
  auction,
  result,
  winnerName,
}: {
  auction: MockAuction;
  result: MockAuctionResult;
  winnerName: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  useLayoutEffect(() => {
    const fit = () =>
      dialog.current?.style.setProperty(
        '--result-scale',
        String(viewportScale(document.documentElement.clientWidth, window.innerHeight, 1920, 1080)),
      );
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  const sold = result.status === 'SOLD';
  const pending = result.status === 'PENDING_TIE';
  return (
    <dialog
      ref={dialog}
      aria-labelledby={title}
      onCancel={(event) => event.preventDefault()}
      className="moa-modal fixed top-[calc(309px*var(--result-scale,1))] left-[calc(50vw-230px*var(--result-scale,1))] m-0 h-[463px] max-h-none w-[460px] max-w-none origin-top-left scale-[var(--result-scale,1)] rounded-xl border border-[#eeeeee] bg-white p-0 text-center font-jua text-brown-dark"
    >
      <div className="absolute top-[59px] left-[109px] flex h-[160px] w-[240px] items-center justify-center rounded-[10px] bg-cream">
        <Image
          src={auction.itemImage}
          alt={auction.itemName}
          width={108}
          height={90}
          unoptimized
          className="max-h-[100px] object-contain [image-rendering:pixelated]"
        />
      </div>
      <h2
        id={title}
        className="absolute top-[259px] right-5 left-5 text-[22px] leading-7 [overflow-wrap:anywhere]"
      >
        {sold
          ? `${winnerName}님이 낙찰받았어요!`
          : pending
            ? '동률로 결과 판정이 보류되었어요'
            : '낙찰한 친구가 없어 경매가 종료되었어요'}
      </h2>
      <p className="absolute top-[304px] right-5 left-5 text-xl text-brown-muted">
        {auction.itemName} ·{' '}
        {sold
          ? `낙찰가 ${result.winningAmount.toLocaleString('ko-KR')}`
          : pending
            ? '동률 정책 확인 필요'
            : '유찰'}
      </p>
      <Link
        href="/"
        className="absolute top-[368px] left-[79px] flex h-[55px] w-[300px] items-center justify-center rounded-[20px] border-[3px] border-b-[7px] border-brown-dark bg-ivory text-xl focus-visible:outline-3 focus-visible:outline-offset-4"
      >
        광장으로 이동
      </Link>
    </dialog>
  );
}
