import Image from 'next/image';

export interface HeaderProps {
  nickname: string;
  balance: number;
}
export default function Header({ nickname, balance }: HeaderProps) {
  return (
    <header className="relative mx-[50px] mt-10 mb-12 grid h-[88px] grid-cols-[minmax(0,1fr)_166px_minmax(0,1fr)] items-center rounded-[20px] border-[3px] border-b-8 border-brown-dark bg-ivory px-[47px] font-jua max-md:mx-4 max-md:gap-y-3 max-md:px-4 max-sm:h-auto max-sm:grid-cols-2 max-sm:py-4">
      <div className="flex min-w-0 items-center gap-3 text-[28px]">
        <Image
          src="/assets/ui/avatar-tiger.svg"
          alt=""
          width={48}
          height={48}
          className="shrink-0"
        />
        <span className="truncate" title={nickname}>
          {nickname}
        </span>
      </div>
      <Image
        src="/assets/ui/logo-sub.svg"
        alt="MoaMoa"
        width={166}
        height={48}
        className="max-sm:col-span-2 max-sm:row-start-1 max-sm:justify-self-center"
        priority
      />
      <div className="flex items-center gap-5 justify-self-end max-sm:col-span-2 max-sm:row-start-3">
        <div
          role="group"
          className="flex min-w-[148px] items-center justify-between gap-6 rounded-full bg-cream px-3 py-[7px] text-2xl leading-7"
          aria-label={`보유금 ${balance.toLocaleString('ko-KR')}`}
        >
          <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
          <span>{balance.toLocaleString('ko-KR')}</span>
        </div>
        <Image src="/assets/ui/mail.svg" alt="우편함" width={44} height={34} />
      </div>
    </header>
  );
}
