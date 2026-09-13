type NumericRecord = number | string | null;
export interface MarketOverviewRecord {
  total_volume: NumericRecord;
  total_ops: NumericRecord;
  avg_price: NumericRecord;
  avg_bids: NumericRecord;
}
export interface MarketPositionRecord {
  position: string | null;
  count: NumericRecord;
  avg_price: NumericRecord;
  total_volume: NumericRecord;
}
export interface MarketDuelUserRecord {
  id: NumericRecord;
  name: string | null;
  icon: string | null;
  color_index: NumericRecord;
}
export interface MarketDuelRecord {
  winner_id: NumericRecord;
  winner_name: string | null;
  winner_icon: string | null;
  winner_color_index: NumericRecord;
  runner_id: NumericRecord;
  runner_name: string | null;
  runner_icon: string | null;
  runner_color_index: NumericRecord;
  margin: NumericRecord;
}
export interface MarketDuelFacts {
  users: MarketDuelUserRecord[];
  duels: MarketDuelRecord[];
}
