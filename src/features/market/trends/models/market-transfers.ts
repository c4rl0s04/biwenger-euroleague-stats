export interface MarketTransfersInput {
  page?: number;
  limit?: number;
  buyer?: string;
  seller?: string;
}

/** Existing transfer API compatibility names, not an inferred database result. */
export interface MarketTransfer {
  id: number;
  fecha: string | null;
  precio: number;
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
  bids_count: number;
}

export interface MarketTransferPage {
  transfers: MarketTransfer[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MarketValueDetail {
  round_name: string | null;
  date: string | null;
  points: number;
  opponent: string | null;
  team_id: number | null;
}

export interface MarketDuelDetail {
  transfer_id: number;
  transfer_date: string | null;
  player_id: number;
  player_name: string | null;
  player_img: string | null;
  winner_id: number;
  winner_name: string | null;
  winner_icon: string | null;
  winner_color_index: number | null;
  runner_id: number;
  runner_name: string | null;
  runner_icon: string | null;
  runner_color_index: number | null;
  winning_bid: number;
  second_bid: number;
  margin: number;
}
