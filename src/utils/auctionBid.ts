import type { BidFailure, BidMemberSnapshot, MockAuction } from '../types/auctionMock';
import { parseAuctionPrice } from './auction';
import { exceedsPublicHighestBid } from './auctionPolicy';

/** Formatting uses strings so unsafe integers are never rounded into valid amounts. */
export function formatBidInput(value: string): string {
  const digits = value.replaceAll(',', '');
  return /^\d+$/.test(digits) ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : value;
}

export function bidWindowOpen(auction: MockAuction, now: Date): boolean {
  return auction.status === 'IN_PROGRESS' && Date.parse(auction.endTime) > now.getTime();
}

/** Shared by the input preview and synchronous store command. First failure wins. */
export function validateAuctionBid(
  auction: MockAuction | undefined,
  value: string,
  member: BidMemberSnapshot,
  now: Date,
): { ok: true; amount: number } | BidFailure {
  if (!auction) return { ok: false, code: 'NOT_FOUND', message: '경매방을 찾을 수 없어요.' };
  if (!member.hydrated)
    return { ok: false, code: 'NOT_READY', message: '보유 화폐를 불러오는 중이에요.' };
  if (auction.status !== 'IN_PROGRESS')
    return { ok: false, code: 'NOT_RUNNING', message: '경매 진행 중에만 입찰할 수 있어요.' };
  if (!bidWindowOpen(auction, now))
    return { ok: false, code: 'EXPIRED', message: '입찰 시간이 지났어요.' };
  if (!value) return { ok: false, code: 'EMPTY', message: '' };
  const amount = parseAuctionPrice(value.replaceAll(',', ''));
  if (amount === null)
    return {
      ok: false,
      code: 'INVALID',
      message: '안전 정수 범위의 0보다 큰 숫자를 입력해 주세요.',
    };
  if (auction.type === 'PUBLIC' && auction.highestBid !== null) {
    if (!exceedsPublicHighestBid(amount, auction.highestBid))
      return {
        ok: false,
        code: 'HIGHEST_PRICE',
        message: '현재 최고 입찰가보다 높은 금액을 입력해 주세요!',
      };
  } else if (amount < auction.startingPrice) {
    // Provisional floor: initial Public and all Private submissions allow equality.
    return {
      ok: false,
      code: 'STARTING_PRICE',
      message: `시작가 ${auction.startingPrice.toLocaleString('ko-KR')}코인 이상으로 적어주세요!`,
    };
  }
  if (!Number.isSafeInteger(member.balance) || amount > member.balance)
    return { ok: false, code: 'BALANCE', message: '보유 화폐가 부족해요!' };
  return { ok: true, amount };
}
