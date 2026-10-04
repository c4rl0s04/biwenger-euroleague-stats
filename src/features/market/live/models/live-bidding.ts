/** Serializable, account-specific view of Biwenger's current market. */
export interface LiveMarketOffer {
  id: number | null;
  amount: number | null;
}

export interface LiveMarketListing {
  playerId: number;
  playerName: string;
  sellerId: number | null;
  sellerName: string;
  price: number;
  closesAt: string;
  isOwnListing: boolean;
  ownWaitingOffers: LiveMarketOffer[];
}

export interface LiveBidMarket {
  balance: number;
  maximumBid: number;
  observedAt: string;
  listings: LiveMarketListing[];
}

export interface LiveBidCount {
  playerId: number;
  totalBids: number;
  observedAt: string;
}
