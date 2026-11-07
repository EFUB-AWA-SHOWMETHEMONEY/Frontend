'use client';

import { useEffect, useEffectEvent, useId, useRef } from 'react';

/** Frontend mock completion only; never changes real account data. */
export default function BankCompletionPreview({
  isOpen,
  productName,
  onConfirm,
}: {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressedOutside = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const notifyClose = useEffectEvent(onConfirm);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousFocus = document.activeElement;
    const handleClose = () => {
      if (!dialog.open) notifyClose();
    };
    dialog.addEventListener('close', handleClose);
    dialog.showModal();
    const timer = window.setTimeout(() => notifyClose(), 4000);
    return () => {
      window.clearTimeout(timer);
      dialog.removeEventListener('close', handleClose);
      dialog.close();
      pressedOutside.current = false;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen]);

  function isOutside(x: number, y: number) {
    const bounds = dialogRef.current?.getBoundingClientRect();
    return !!bounds && (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        onConfirm();
      }}
      onPointerDown={(event) => {
        pressedOutside.current = isOutside(event.clientX, event.clientY);
      }}
      onClick={(event) => {
        if (pressedOutside.current && isOutside(event.clientX, event.clientY)) onConfirm();
        pressedOutside.current = false;
      }}
      className="fixed inset-0 m-auto box-border h-[219px] max-h-[calc(100dvh-24px)] w-[399px] max-w-[calc(100vw-24px)] rounded-xl border border-[#EEEEEE] bg-white p-0 text-center font-jua text-brown-dark outline-none backdrop:bg-black/30"
    >
      <div
        aria-hidden="true"
        className="absolute top-[39px] left-1/2 flex size-[60px] -translate-x-1/2 items-center justify-center rounded-full bg-cream"
      >
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <path
            d="M24.333 8L11.5 20.8333L5.667 15"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 id={titleId} className="absolute inset-x-3 top-[109px] text-2xl leading-[30px]">
        상품 가입 완료
      </h2>
      <p
        id={descriptionId}
        className="absolute inset-x-3 top-[149px] text-xl leading-[25px] text-brown-muted"
      >
        {productName}에 가입했어요
      </p>
    </dialog>
  );
}
