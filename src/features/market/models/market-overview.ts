export interface MarketOverviewKPIs {
  totalVolume: number;
  totalOps: number;
  avgPrice: number;
  avgBids: number;
}
export interface PositionAnalysis {
  mostSigned: { position: string | null; count: number } | null;
  distribution: {
    position: string | null;
    count: number;
    avg_price: number;
    total_volume: number;
  }[];
}
export interface BidDuelUser {
  id: number;
  name: string | null;
  icon: string | null;
  color_index: number | null;
}
export interface BidDuelRecord {
  wins: number;
  losses: number;
  duels: number;
  total_margin: number;
  avg_margin: number;
}
export interface BidDuelSummary {
  user1_id: number;
  user1_name: string | null;
  user1_icon: string | null;
  user1_color_index: number | null;
  user2_id: number;
  user2_name: string | null;
  user2_icon: string | null;
  user2_color_index: number | null;
  wins1: number;
  wins2: number;
  duels: number;
  total_margin: number;
  avg_margin: number;
  leader_id: number | null;
  leader_name: string | null;
  trailer_id: number | null;
  trailer_name: string | null;
}
export interface BiddingDuelsStats {
  users: BidDuelUser[];
  matrix: Record<number, Record<number, BidDuelRecord>>;
  hottestRivalry: BidDuelSummary | null;
  biggestDominance: BidDuelSummary | null;
}
