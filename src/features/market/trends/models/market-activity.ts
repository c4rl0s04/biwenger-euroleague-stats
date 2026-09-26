export interface MarketActivityTransfer {
  id: number;
  fecha: string | null;
  player_id: number | null;
  precio: number | null;
  vendedor: string | null;
  comprador: string | null;
}

/** The basic fecha-based series is distinct from timestamp-based trend analysis. */
export interface MarketActivityTrend {
  date: string | null;
  count: number;
  avg_value: number;
}

export interface MarketActivityKPIs {
  total_transfers: number;
  avg_value: number;
  max_value: number;
  min_value: number;
  active_buyers: number;
  active_sellers: number;
}

export interface MarketActivityOverview {
  kpis: MarketActivityKPIs;
  transfers: MarketActivityTransfer[];
  trends: MarketActivityTrend[];
}
