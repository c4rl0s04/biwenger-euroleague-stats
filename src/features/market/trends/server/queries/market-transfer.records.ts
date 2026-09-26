export interface MarketTransferRecord {
  id: number;
  fecha: string | null;
  precio: number | string;
  vendedor: string | null;
  comprador: string | null;
  vendedor_id: string | null;
  vendedor_icon: string | null;
  vendedor_color_index: number | null;
  comprador_id: string | null;
  comprador_icon: string | null;
  comprador_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_position: string | null;
  player_img: string | null;
  player_team: string | null;
  bids_count: string | number;
}

export interface MarketTransferPageRecords {
  rows: MarketTransferRecord[];
  total: string | number;
  page: number;
  limit: number;
}

export interface MarketValueDetailRecord {
  round_name: string | null;
  date: Date | string | null;
  points: number | string;
  opponent: string | null;
  team_id: number | null;
}

export interface MarketDuelDetailRecord {
  transfer_id: string | number;
  transfer_date: string | null;
  player_id: string | number;
  player_name: string | null;
  player_img: string | null;
  winner_id: string | number;
  winner_name: string | null;
  winner_icon: string | null;
  winner_color_index: string | number | null;
  runner_id: string | number;
  runner_name: string | null;
  runner_icon: string | null;
  runner_color_index: string | number | null;
  winning_bid: string | number;
  second_bid: string | number;
  margin: string | number;
}
