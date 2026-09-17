export interface ManagerDirectoryViewModel {
  id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
}
import type { MarketOverviewKPIs, PositionAnalysis, BiddingDuelsStats } from './market-overview';
import type {
  TopTransferredPlayer,
  EnrichedTransfer,
  BigSpender,
  BestSeller,
  MostOwnersPlayer,
  ManagerMarketStats,
} from './market-summary';
import type {
  RecordBid,
  TheThief,
  TheVictim,
  BiggestSteal,
  OverpayerManager,
  InflatedPlayer,
} from './market-auctions';
import type {
  BestRevaluation,
  BestValuePlayer,
  InfirmaryPlayer,
  SingleFlip,
  PercentageGain,
  MissedOpportunity,
  TopTrader,
  ProfitablePlayer,
  LossyPlayer,
  QuickFlip,
  LongHold,
  Devaluation,
} from './market-investments';
import type { MarketTrendDay } from './market-trends';
import type { CurrentMarketListing } from './market-catalogue';

export interface NamedManagerEnrichment {
  id?: string;
  icon?: string | null;
  color_index?: number;
  user_color_index?: number;
}
export interface BuyerManagerEnrichment {
  buyer_id?: string | null;
  buyer_icon?: string | null;
  buyer_color?: number | null;
  user_color_index?: number;
}
export interface BiggestStealEnrichment {
  winner_icon?: string | null;
  winner_color?: number;
  second_bidder_id?: string;
  second_bidder_icon?: string | null;
  second_bidder_color?: number;
  user_color_index?: number;
}

export interface MarketAnalytics {
  kpis: MarketOverviewKPIs;
  topPlayer: TopTransferredPlayer[];
  recordTransfer: (EnrichedTransfer & BuyerManagerEnrichment)[];
  bigSpender: (BigSpender & NamedManagerEnrichment)[];
  recordBid: (RecordBid & BuyerManagerEnrichment)[];
  trends: MarketTrendDay[];
  positionStats: PositionAnalysis;
  managerStats: ManagerMarketStats[];
  bestSeller: (BestSeller & NamedManagerEnrichment)[];
  bestRevaluation: BestRevaluation[];
  bestValue: BestValuePlayer[];
  infirmary: InfirmaryPlayer[];
  bestFlip: SingleFlip[];
  worstFlip: SingleFlip[];
  bestPercentage: PercentageGain[];
  mostOwners: MostOwnersPlayer[];
  theThief: (TheThief & NamedManagerEnrichment)[];
  biggestSteal: (BiggestSteal & BiggestStealEnrichment)[];
  theVictim: (TheVictim & NamedManagerEnrichment)[];
  overpayerManager: (OverpayerManager & NamedManagerEnrichment)[];
  inflatedPlayer: InflatedPlayer[];
  biddingDuels: BiddingDuelsStats;
  missedOpportunity: MissedOpportunity[];
  topTrader: (TopTrader & { user_icon?: string | null })[];
  profitablePlayer: ProfitablePlayer[];
  lossyPlayer: LossyPlayer[];
  quickestFlip: QuickFlip[];
  longestHold: LongHold[];
  worstRevaluation: Devaluation[];
  currentMarketListings: CurrentMarketListing[];
  allUsers: ManagerDirectoryViewModel[];
}
