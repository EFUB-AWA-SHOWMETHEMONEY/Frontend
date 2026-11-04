import type { HTMLAttributes, ReactNode } from 'react';

interface ShopContainerProps extends HTMLAttributes<HTMLElement> {
  toolbar?: ReactNode;
}

/** Place after the shared header: the 61px toolbar and 48px gap set Y=285. */
export default function ShopContainer({
  toolbar,
  children,
  className = '',
  ...props
}: ShopContainerProps) {
  return (
    <div className="mx-auto w-[min(1820px,calc(100%-100px))] max-md:w-[calc(100%-32px)] [@media(width>=1024px)_and_(height>=600px)]:w-[1820px]">
      <div className="mb-12 flex min-h-[61px]">{toolbar}</div>
      <section
        className={`relative box-border flex min-h-[659px] w-full flex-col gap-10 rounded-[20px] bg-ivory px-20 pt-10 pb-8 [@media(width<1024px),(height<600px)]:px-[clamp(20px,4.1667vw,80px)] ${className}`}
        {...props}
      >
        {children}
      </section>
    </div>
  );
}
