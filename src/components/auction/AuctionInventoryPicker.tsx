import Image from 'next/image';
import type { auctionInventory } from '@/utils/auction';
import styles from './auction-create.module.css';

export default function AuctionInventoryPicker({
  items,
  selectedId,
  onSelect,
  hydrated,
}: {
  items: ReturnType<typeof auctionInventory>;
  selectedId: string;
  onSelect: (id: string) => void;
  hydrated: boolean;
}) {
  if (!hydrated || items.length === 0)
    return (
      <p className={styles.inventoryEmpty} role="status">
        {hydrated ? '경매에 등록할 보유 아이템이 없습니다.' : '보유 아이템을 불러오는 중입니다.'}
      </p>
    );
  return (
    <div className={styles.inventory} role="group" aria-label="경매에 올릴 아이템">
      {items.map(({ instanceId, product }) => (
        <button
          type="button"
          key={instanceId}
          className={styles.tile}
          aria-label={product.name}
          aria-pressed={instanceId === selectedId}
          onClick={() => onSelect(instanceId)}
        >
          <Image
            src={product.image.replace('/assets/items/', '/assets/items/pixelated/')}
            width={product.id === 'ribbon' ? 90 : 120}
            height={product.id === 'ribbon' ? 90 : 120}
            alt=""
            unoptimized
          />
        </button>
      ))}
      {Array.from({ length: Math.max(0, 5 - items.length) }, (_, index) => (
        <span key={`empty-${index}`} className={styles.emptyTile} aria-hidden="true" />
      ))}
    </div>
  );
}
