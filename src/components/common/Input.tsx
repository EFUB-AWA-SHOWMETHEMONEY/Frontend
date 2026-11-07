import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: ReactNode; // 입력창 우측에 붙는 요소
  className?: string; // 바깥 박스 스타일
  inputClassName?: string; // 실제 input 요소 스타일
}

export default function Input({
  type = 'text',
  className = '',
  inputClassName = '',
  suffix,
  ...props
}: InputProps) {
  return (
    <div
      className={`flex h-[57px] w-full items-center gap-2.5 rounded-[12px] border-3 border-brown-muted bg-white px-5 focus-within:border-brown-dark ${className}`}
    >
      <input
        type={type}
        className={`h-full min-w-0 flex-1 bg-transparent text-[20px] text-brown-muted outline-none placeholder:text-brown-light focus:text-brown-dark ${inputClassName}`}
        {...props}
      />
      {suffix}
    </div>
  );
}
