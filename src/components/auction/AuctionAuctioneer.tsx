import type { MockAuction } from '@/types/auctionMock';

export default function AuctionAuctioneer({
  auction,
  hasOwnBid = false,
}: {
  auction: MockAuction;
  hasOwnBid?: boolean;
}) {
  const isPrivate = auction.type === 'PRIVATE';
  const title =
    auction.status === 'ENDED'
      ? '경매가 종료되었어요'
      : auction.status === 'SCHEDULED'
        ? '경매 시작을 기다리고 있어요'
        : isPrivate
          ? hasOwnBid
            ? '입찰 금액을 받았어요!'
            : '자, 얼마까지 부르시겠어요?'
          : auction.highestBid === null
            ? '아직 입찰이 없어요!'
            : `현재 최고 입찰가 ${auction.highestBid.toLocaleString('ko-KR')}!`;
  const message =
    auction.status === 'ENDED'
      ? '참여해 주셔서 감사합니다!'
      : auction.status === 'SCHEDULED'
        ? '시작 후 입찰해 주세요!'
        : isPrivate
          ? hasOwnBid
            ? '최근에 낸 입찰가가 유효해요!'
            : '원하는 금액을 입력해 주세요!'
          : auction.highestBid === null
            ? '첫 입찰을 기다리고 있어요!'
            : '더 부르실 분 없나요?';
  return (
    <aside
      className="absolute top-[316px] left-[318px] h-[128px] w-[532px]"
      aria-label="펭귄 경매 진행자 안내"
    >
      {/* Penguin is part of the separately extracted static scene; only its speech changes. */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true" viewBox="318 316 532 128">
        <path
          d="M826 319C837.046 319 846 327.954 846 339V421C846 432.046 837.046 441 826 441H386C374.954 441 366 432.046 366 421V412.987L324 397L366 381.012V339C366 327.954 374.954 319 386 319H826Z"
          fill="white"
          stroke="var(--color-brown-dark)"
          strokeWidth="3"
        />
      </svg>
      <div className="relative pt-[27px] pr-6 pl-[84px]">
        <p className="truncate text-2xl leading-[30px] text-brown-light" title={title}>
          {title}
        </p>
        <p className="mt-1 text-[32px] leading-10">{message}</p>
      </div>
    </aside>
  );
}
