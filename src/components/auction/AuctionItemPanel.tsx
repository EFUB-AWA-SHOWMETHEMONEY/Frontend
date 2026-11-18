import Image from 'next/image';
import type { MockAuction } from '@/types/auctionMock';

export default function AuctionItemPanel({
  auction,
  highestBidderName,
}: {
  auction: MockAuction;
  highestBidderName: string | null;
}) {
  // Original item aspect ratios/placement differ between the two supplied screens.
  const image =
    auction.itemId === 'wizard'
      ? { width: 108, height: 81, position: 'top-[42px] left-[166px] w-[108px] h-[81px]' }
      : auction.itemId === 'heart'
        ? { width: 120, height: 40, position: 'top-[74px] left-40 w-[120px] h-10' }
        : { width: 120, height: 90, position: 'top-11 left-40 w-[120px] h-[90px]' };
  return (
    <section className="absolute top-[236px] left-[1013px] w-[440px]" aria-label="경매 아이템">
      <div className="mx-auto h-[220px] w-[220px] rounded-full border-[10px] border-[#a4948180] bg-[#fff4d6]">
        <Image
          src={auction.itemImage}
          alt={auction.itemName}
          width={image.width}
          height={image.height}
          unoptimized
          className={`absolute object-contain [image-rendering:pixelated] ${image.position}`}
        />
      </div>
      <div className="relative -mt-[77px] h-[122px] border-[3px] border-brown-dark bg-[#a7774e] px-[18px] pt-[13px]">
        <div className="mb-[6px] flex items-center justify-between gap-3 text-ivory">
          <h1 className="min-w-0 truncate text-2xl leading-[30px]" title={auction.itemName}>
            {auction.itemName}
          </h1>
          <p className="shrink-0 text-xl text-ivory/80">
            시작가 {auction.startingPrice.toLocaleString('ko-KR')}
          </p>
        </div>
        <div className="flex h-[55px] items-center justify-between gap-3 rounded-[15px] border-[3px] border-brown-muted bg-white px-[26px] text-xl">
          {auction.type === 'PRIVATE' ? (
            <p className="flex w-full items-center justify-center gap-3 whitespace-nowrap">
              <svg
                aria-hidden="true"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V6a4 4 0 0 1 8 0v4" />
              </svg>
              비공개 입찰 <span aria-hidden="true">|</span> 마감 후 공개
            </p>
          ) : (
            <>
              <span className="min-w-0 truncate" title={highestBidderName ?? undefined}>
                {highestBidderName ?? '아직 입찰 없음'}
              </span>
              <span className="flex shrink-0 items-center gap-2" aria-label="현재 최고 입찰가">
                <Image src="/assets/ui/coin.svg" alt="" width={24} height={24} />
                {auction.highestBid?.toLocaleString('ko-KR') ?? '—'}
              </span>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
