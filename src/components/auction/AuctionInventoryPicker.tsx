import Image from 'next/image';
import type { auctionInventory } from '@/utils/auction';

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
      <p
        className="absolute top-[107px] left-10 flex h-[220px] w-[1210px] items-center justify-center rounded-[10px] bg-cream text-2xl text-brown-muted"
        role="status"
      >
        {hydrated ? '경매에 등록할 보유 아이템이 없습니다.' : '보유 아이템을 불러오는 중입니다.'}
      </p>
    );
  return (
    <div
      className="absolute top-[107px] left-10 flex h-[220px] w-[1210px] [scrollbar-width:thin] [scrollbar-color:var(--color-beige)_var(--color-cream)] items-start gap-10 overflow-x-auto overflow-y-hidden px-[3px] pt-[3px] pb-3"
      role="group"
      aria-label="경매에 올릴 아이템"
    >
      {items.map(({ instanceId, product }) => (
        <button
          type="button"
          key={instanceId}
          className="flex h-[200px] shrink-0 basis-[200px] cursor-pointer items-center justify-center rounded-[10px] border-[3px] border-brown-light bg-cream aria-pressed:border-coral aria-pressed:shadow-[0_5px_0_var(--color-coral)] [&_img]:object-contain [&_img]:[image-rendering:pixelated]"
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
        <span
          key={`empty-${index}`}
          className="h-[200px] shrink-0 basis-[200px] rounded-[10px] border-[3px] border-dashed border-brown-light bg-cream"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
