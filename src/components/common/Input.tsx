import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export default function Input({ type = 'text', className = '', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={`h-[57px] w-full rounded-[12px] border-3 border-brown-muted bg-white px-5 text-[20px] text-brown-muted outline-none placeholder:text-brown-light focus:border-brown-dark focus:text-brown-dark ${className}`}
      {...props}
    />
  );
}
