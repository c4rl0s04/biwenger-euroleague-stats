export interface MarketActivityTransferRecord {
  id: number;
  fecha: string | null;
  player_id: number | null;
  precio: number | null;
  vendedor: string | null;
  comprador: string | null;
}

export interface MarketActivityTrendRecord {
  date: string | null;
  count: string | number;
  avg_value: string | number | null;
}

export interface MarketActivityKPIRecord {
  total_transfers: string | number;
  avg_value: string | number | null;
  max_value: number | string | null;
  min_value: number | string | null;
  active_buyers: string | number;
  active_sellers: string | number;
}
