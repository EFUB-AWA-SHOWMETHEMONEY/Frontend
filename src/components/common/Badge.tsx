import type { HTMLAttributes } from 'react';
const VARIANTS = { hat: 'bg-badge-hat', face: 'bg-badge-face' } as const;
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: keyof typeof VARIANTS;
}
export default function Badge({ variant, children, className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-[33px] items-center rounded-full px-3 font-jua text-xl leading-none text-white ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
