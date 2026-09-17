/** Established HTTP field names; numeric aggregates are normalized by the mapper. */
export interface MarketTrendDay {
  date: string;
  volume: number;
  avg_price: number;
  ops_count: number;
  transfers: { player_name: string | null; price: number | null }[];
}
