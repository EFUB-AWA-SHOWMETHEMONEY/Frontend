import Image from 'next/image';
import Button from '@/components/common/Button';
import type { AuctionSummary } from '@/types/auction';
import styles from './auction.module.css';

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
  return (
    <article className={styles.card} aria-labelledby={`title-${auction.id}`}>
      <div className={styles.itemImage}>
        <Image src={auction.itemImage} alt="" width={140} height={140} unoptimized />
      </div>
      <div className={styles.identity}>
        <span
          className={`${styles.badge} ${auction.type === 'PUBLIC' ? styles.public : styles.private}`}
        >
          {auction.type === 'PUBLIC' ? 'Public' : 'Private'}
        </span>
        <h2 id={`title-${auction.id}`} title={auction.itemName}>
          {auction.itemName}
        </h2>
      </div>
      <div className={styles.price}>
        <span>시작가</span>
        <strong className={auction.startingPrice >= 1_000_000_000 ? styles.longPrice : undefined}>
          <Image src="/assets/ui/coin.svg" alt="" width={28} height={28} />
          {auction.startingPrice.toLocaleString('ko-KR')}
        </strong>
      </div>
      <div className={styles.details}>
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
        aria-label={`${auction.itemName} ${auction.canEnter ? '입장하기' : '입장 마감'}`}
      >
        {auction.canEnter ? '입장하기' : '입장 마감'}
      </Button>
    </article>
  );
}
