'use client';
import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from 'react';
import Button from '@/components/common/Button';
interface ModalProps {
  isOpen: boolean;
  /** Keep child state only for flows that explicitly preserve drafts. */
  keepMounted?: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** Wide fixed-canvas dialog; its parent supplies --modal-scale. */
  size?: 'default' | 'wide';
}
export default function Modal({
  isOpen,
  keepMounted = false,
  onClose,
  title,
  children,
  actions,
  className = '',
  size = 'default',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const notifyClose = useEffectEvent(() => onClose());
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
    const handleClose = () => {
      // Ignore a queued close event from an earlier opening of this dialog.
      if (dialog.open) return;
      restore();
      notifyClose();
    };
    dialog.addEventListener('close', handleClose);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      // Controlled closes and unmounts must not notify the parent again.
      dialog.removeEventListener('close', handleClose);
      dialog.close();
      restore();
    };
  }, [isOpen]);
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`moa-modal fixed box-border flex-col gap-8 rounded-[20px] border-[3px] border-brown-dark bg-white p-10 font-jua text-black open:flex ${size === 'wide' ? 'inset-auto top-[calc(231.5px*var(--modal-scale,1))] left-[calc(50vw-643px*var(--modal-scale,1))] m-0 h-[673px] max-h-none w-[1286px] max-w-none origin-top-left scale-[var(--modal-scale,1)] overflow-visible' : 'inset-0 m-auto h-[652px] max-h-[calc(100dvh-32px)] w-[800px] max-w-[calc(100vw-32px)] overflow-y-auto max-sm:p-5'} ${className}`}
    >
      <h2
        id={titleId}
        className={`shrink-0 text-[28px] leading-[35px] ${size === 'wide' ? 'absolute top-10 left-10' : ''}`}
      >
        {title}
      </h2>
      <div className="min-w-0 flex-1">{(isOpen || keepMounted) && children}</div>
      <div
        className={`flex shrink-0 flex-wrap justify-end gap-5 ${size === 'wide' ? 'absolute right-10 bottom-10' : ''}`}
      >
        <Button variant="secondary" size="close" onClick={onClose}>
          닫기
        </Button>
        {(isOpen || keepMounted) && actions}
      </div>
    </dialog>
  );
}
