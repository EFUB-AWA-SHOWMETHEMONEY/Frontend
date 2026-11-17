import { AUCTION_CHAT_MAX_LENGTH } from '../constants/auctionMock';

export function validAuctionChat(content: string): boolean {
  return content.trim().length > 0 && content.length <= AUCTION_CHAT_MAX_LENGTH;
}

export function shouldSendChatKey(key: string, composing: boolean, keyCode: number): boolean {
  return key === 'Enter' && !composing && keyCode !== 229;
}

export function nearChatBottom(
  scrollHeight: number,
  clientHeight: number,
  scrollTop: number,
): boolean {
  return scrollHeight - clientHeight - scrollTop <= 32;
}
