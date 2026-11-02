'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import Button from '@/components/common/Button';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
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
      className={`moa-modal fixed inset-0 m-auto max-h-[calc(100dvh-32px)] w-[800px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-[20px] border-[3px] border-brown-dark bg-white p-10 font-jua text-black ${className}`}
    >
      <h2 id={titleId} className="mb-8 text-[28px] leading-[35px]">
        {title}
      </h2>
      {children}
      <div className="mt-8 flex flex-wrap justify-end gap-5">
        <Button variant="secondary" size="close" onClick={onClose}>
          닫기
        </Button>
        {actions}
      </div>
    </dialog>
  );
}
