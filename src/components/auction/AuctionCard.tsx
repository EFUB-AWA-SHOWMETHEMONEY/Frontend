import Image from 'next/image';
import Button from '@/components/common/Button';
import { auctionEntryLabel } from '@/utils/auction';
import type { AuctionSummary } from '@/types/auction';

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export default function AuctionCard({
  auction,
  onEnter,
}: {
  auction: AuctionSummary;
  onEnter: (auctionId: string) => void;
}) {
  const entryLabel = auctionEntryLabel(auction);
  return (
    <article
      className="h-[441px] w-[300px] shrink-0 rounded-[20px] border-[3px] border-brown-dark bg-white p-5 [&>button]:h-[61px] [&>button:disabled]:border-b-[3px]"
      aria-labelledby={`title-${auction.id}`}
    >
      <div className="flex h-[140px] items-center justify-center rounded-[10px] bg-cream [&_img]:object-contain [&_img]:[image-rendering:pixelated]">
        <Image src={auction.itemImage} alt="" width={140} height={140} unoptimized />
      </div>
      <div className="mt-5 flex h-[35px] items-center gap-3 whitespace-nowrap [&_h2]:min-w-0 [&_h2]:overflow-hidden [&_h2]:text-[28px] [&_h2]:leading-[35px] [&_h2]:text-ellipsis [&_h2]:text-black">
        <span
          className={`inline-flex h-[33px] shrink-0 items-center rounded-[17px] px-3 text-xl text-white ${auction.type === 'PUBLIC' ? 'bg-badge-face' : 'bg-[#8064b5]'}`}
        >
          {auction.type === 'PUBLIC' ? 'Public' : 'Private'}
        </span>
        <h2 id={`title-${auction.id}`} title={auction.itemName}>
          {auction.itemName}
        </h2>
      </div>
      <div className="mt-5 flex h-[35px] items-center justify-between text-2xl text-brown-muted">
        <span>시작가</span>
        <strong
          className={`flex items-center font-normal text-black ${auction.startingPrice >= 1_000_000_000 ? 'gap-1 text-sm [&_img]:h-5 [&_img]:w-5' : 'gap-2 text-[28px]'}`}
        >
          <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
          {auction.startingPrice.toLocaleString('ko-KR')}
        </strong>
      </div>
      <div className="mt-5 mb-[18px] flex h-[49px] items-center justify-between border-t border-[#eaeaea] text-xl text-brown-muted [&_strong]:ml-1.5 [&_strong]:text-2xl [&_strong]:font-normal [&_strong]:text-brown-dark [&_time]:ml-1.5 [&_time]:text-2xl [&_time]:font-normal [&_time]:text-brown-dark">
        <span>
          시작{' '}
          <time dateTime={auction.startTime}>
            {timeFormatter.format(new Date(auction.startTime))}
          </time>
        </span>
        <span>
          인원{' '}
          <strong>
            {auction.participantCount}/{auction.participantCapacity}
          </strong>
        </span>
      </div>
      <Button
        variant="bank"
        disabled={!auction.canEnter}
        onClick={() => onEnter(auction.id)}
        aria-label={`${auction.itemName} ${entryLabel}`}
      >
        {entryLabel}
      </Button>
    </article>
  );
}
