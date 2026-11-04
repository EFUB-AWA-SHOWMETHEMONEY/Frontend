import Image from 'next/image';
import type { ReactNode } from 'react';
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}
export default function EmptyState({
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <section
      className={`flex min-h-[632px] flex-col items-center rounded-[20px] bg-ivory px-6 pt-[120px] pb-10 text-center font-jua ${className}`}
    >
      <Image src="/assets/ui/empty-items.svg" alt="" width={160} height={112} />
      <h2 className="mt-10 text-[32px] leading-[40px] text-black">{title}</h2>
      {description && (
        <p className="mt-5 text-[28px] leading-[35px] text-brown-muted">{description}</p>
      )}
      {action && <div className="mt-11 max-w-full">{action}</div>}
    </section>
  );
}
