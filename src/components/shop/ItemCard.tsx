import type { HTMLAttributes, ButtonHTMLAttributes } from 'react';

export function ItemCard({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <article
      className={`box-border flex h-[432px] w-[300px] max-w-full shrink-0 flex-col gap-5 rounded-[20px] border-[3px] border-brown-dark bg-white p-5 text-start ${className}`}
      {...props}
    />
  );
}

interface SellItemCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function SellItemCard({
  selected = false,
  className = '',
  type = 'button',
  ...props
}: SellItemCardProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={selected}
      className={`box-border flex h-[301px] w-[300px] max-w-full shrink-0 cursor-pointer flex-col gap-5 rounded-[20px] border-[3px] border-brown-dark bg-white p-5 text-start ${selected ? 'h-[306px]! border-b-8! border-coral!' : ''} ${className}`}
    />
  );
}
