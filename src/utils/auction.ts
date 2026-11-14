import { findProduct } from '../constants/shop';
import type { OwnedItem } from '../stores/shopStore';
import type { AuctionSummary, CreateAuctionInput } from '../types/auction';

/** Auction times follow the same Asia/Seoul clock as the list, independent of OS timezone. */
export function auctionDate(now: Date): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function auctionTimeOptions(date: string, now: Date): string[] {
  if (date !== auctionDate(now)) return [];
  return Array.from({ length: 144 }, (_, index) => {
    const minutes = index * 10;
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }).filter((time) => Date.parse(`${date}T${time}:00+09:00`) > now.getTime());
}

export function validAuctionTime(value: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]0:00\+09:00$/.test(value)) return false;
  return value.slice(0, 10) === auctionDate(now) && Date.parse(value) > now.getTime();
}

/** Reject non-digits and unsafe integers rather than rounding or silently truncating. */
export function parseAuctionPrice(digits: string): number | null {
  if (!/^\d+$/.test(digits)) return null;
  const price = Number(digits);
  return Number.isSafeInteger(price) && price > 0 ? price : null;
}

export function auctionInventory(inventory: readonly OwnedItem[]) {
  return inventory.flatMap((owned) => {
    const product = findProduct(owned.productId);
    return product ? [{ ...owned, product }] : [];
  });
}

export function createMockAuction(
  input: CreateAuctionInput,
  member: { hydrated: boolean; inventory: readonly OwnedItem[] },
  now: Date,
  createId: () => string,
): { ok: true; auction: AuctionSummary } | { ok: false; error: string } {
  if (!member.hydrated) return { ok: false, error: '보유 아이템을 불러오는 중입니다.' };
  const owned = member.inventory.find((item) => item.instanceId === input.ownedItemInstanceId);
  const product = owned && findProduct(owned.productId);
  if (!owned || !product) return { ok: false, error: '현재 보유한 아이템을 다시 선택해 주세요.' };
  if (!Number.isSafeInteger(input.startingPrice) || input.startingPrice <= 0)
    return { ok: false, error: '시작가는 안전 정수 범위의 양의 정수로 입력해 주세요.' };
  if (!validAuctionTime(input.startTime, now))
    return { ok: false, error: '오늘의 미래 시간을 10분 단위로 선택해 주세요.' };
  if (input.type !== 'PUBLIC' && input.type !== 'PRIVATE')
    return { ok: false, error: '경매 방식을 선택해 주세요.' };
  return {
    ok: true,
    auction: {
      id: createId(),
      ownedItemInstanceId: owned.instanceId,
      itemId: product.id,
      itemName: product.name,
      itemImage: product.image.replace('/assets/items/', '/assets/items/pixelated/'),
      startingPrice: input.startingPrice,
      startTime: input.startTime,
      type: input.type,
      participantCount: 0,
      participantCapacity: 20,
      status: 'SCHEDULED',
      canEnter: true,
    },
  };
}
