export type AuctionType = 'PUBLIC' | 'PRIVATE';
export type AuctionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED';

export interface AuctionSummary {
  id: string;
  ownedItemInstanceId?: string;
  itemId: string;
  itemName: string;
  itemImage: string;
  type: AuctionType;
  startingPrice: number;
  /** ISO 8601 timestamp with an explicit timezone. */
  startTime: string;
  participantCount: number;
  participantCapacity: number;
  status: AuctionStatus;
  canEnter: boolean;
}

export interface CreateAuctionInput {
  ownedItemInstanceId: string;
  startingPrice: number;
  startTime: string;
  type: AuctionType;
}
