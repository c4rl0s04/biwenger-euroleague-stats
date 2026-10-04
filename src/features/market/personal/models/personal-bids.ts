import type { LiveBidMarket } from '../../live/models/live-bidding';

export type PersonalBidStatus =
  | 'pending'
  | 'running'
  | 'submitted'
  | 'skipped'
  | 'uncertain'
  | 'failed'
  | 'cancelled';

export interface PersonalBidRule {
  id: string;
  playerId: number;
  playerName: string;
  sellerId: number | null;
  listingPrice: number;
  closesAt: string;
  executeAt: string;
  amountWithoutBids: number;
  amountWithBids: number;
  status: PersonalBidStatus;
  resultCode: string | null;
  submittedAmount: number | null;
  createdAt: string;
}

export interface PersonalBidWorkspace {
  market: LiveBidMarket;
  rules: PersonalBidRule[];
  schedulingAvailable: boolean;
}
