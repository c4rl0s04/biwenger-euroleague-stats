import type { BidDuelUser, BidDuelRecord } from './market-overview';

/** Directional matrix selection; detail history is cached symmetrically for the pair. */
export interface MarketDuelSelection {
  user: BidDuelUser;
  opponent: BidDuelUser;
  record: BidDuelRecord;
}
