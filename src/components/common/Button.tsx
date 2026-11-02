import type { ButtonHTMLAttributes } from 'react';

const VARIANTS = {
  primary: 'bg-coral text-white',
  secondary: 'bg-ivory text-brown-dark',
  selected: 'bg-brown-dark text-white',
} as const;
const SIZES = {
  default: 'h-[61px] w-[254px] text-2xl',
  close: 'h-[61px] w-[126px] text-2xl',
  tab: 'h-[61px] w-[135px] text-2xl',
  empty: 'h-[66px] w-[400px] text-[28px]',
  exit: 'h-[66px] w-[600px] text-[28px]',
} as const;
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
}
export default function Button({
  variant = 'primary',
  size = 'default',
  disabled = false,
  type = 'button',
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex max-w-full shrink-0 items-center justify-center rounded-[20px] border-[3px] border-b-8 border-brown-dark p-2.5 text-center font-jua leading-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-brown-dark enabled:cursor-pointer disabled:cursor-not-allowed disabled:border-b-[3px] disabled:bg-disabled disabled:text-brown-muted ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
