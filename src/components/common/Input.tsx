import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: ReactNode;
}

export default function Input({ type = 'text', className = '', suffix, ...props }: InputProps) {
  if (!suffix) {
    return (
      <input
        type={type}
        className={`h-[57px] w-full rounded-[12px] border-3 border-brown-muted bg-white px-5 text-[20px] text-brown-muted outline-none placeholder:text-brown-light focus:border-brown-dark focus:text-brown-dark ${className}`}
        {...props}
      />
    );
  }

  return (
    <div
      className={`flex h-[57px] w-full items-center gap-2.5 rounded-[12px] border-3 border-brown-muted bg-white px-5 focus-within:border-brown-dark ${className}`}
    >
      <input
        type={type}
        className="h-full min-w-0 flex-1 bg-transparent text-[20px] text-brown-muted outline-none placeholder:text-brown-light focus:text-brown-dark"
        {...props}
      />
      {suffix}
    </div>
  );
}
