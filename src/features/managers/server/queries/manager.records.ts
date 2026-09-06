export type NumericRecord = string | number | null;
export interface ManagerIdentityRecord {
  name: string | null;
  icon: string | null;
  color_index: number | null;
}
export interface ManagerTotalsRecord {
  total_points: NumericRecord;
  best_round: NumericRecord;
  worst_round: NumericRecord;
  average_points: NumericRecord;
  rounds_played: NumericRecord;
}
export interface ManagerPositionsRecord {
  best_position: NumericRecord;
  worst_position: NumericRecord;
  average_position: NumericRecord;
  victories: NumericRecord;
  podiums: NumericRecord;
}
export interface ManagerTransferRecord {
  player_id: number | null;
  player_name: string | null;
  price: NumericRecord;
  comprador: string | null;
  vendedor: string | null;
  fecha: Date | string | null;
  type: string;
}
export interface ManagerTransfersRecord {
  purchases: NumericRecord;
  sales: NumericRecord;
  total_spent: NumericRecord;
  total_received: NumericRecord;
  last_transfers?: ManagerTransferRecord[];
}
export interface ManagerSquadRecord {
  id: number;
  name: string | null;
  position: string | null;
  team: string | null;
  team_img: string | null;
  team_short_name: string | null;
  price: NumericRecord;
  price_increment: NumericRecord;
  points: NumericRecord;
  average: NumericRecord;
  img: string | null;
}
export interface ManagerSeasonRecords {
  user?: ManagerIdentityRecord;
  stats?: ManagerTotalsRecord;
  positions?: ManagerPositionsRecord;
  transfers: ManagerTransfersRecord;
}
