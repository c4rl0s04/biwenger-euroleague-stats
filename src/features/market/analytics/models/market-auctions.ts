export interface RecordBid {
  transfer_id: number | null;
  bid_count: number;
  player_id: number | null;
  precio: number | null;
  comprador: string | null;
  buyer_id: string | null;
  buyer_color_index: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  team_name: string | null;
  team_logo: string | null;
}
export interface TheThief {
  name: string | null;
  user_id: string | null;
  user_color_index: number | null;
  stolen_count: number;
}
export interface BiggestSteal {
  transfer_id: number | null;
  winning_price: number;
  winner: string | null;
  winner_id: string | null;
  winner_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  second_highest_bid: number;
  second_bidder_name: string | null;
  price_diff: number;
}
export interface TheVictim {
  name: string | null;
  user_id: string | null;
  user_color_index: number | null;
  failed_bids_count: number;
}
export interface OverpayerManager {
  name: string | null;
  user_id: string | null;
  user_color_index: number | null;
  contested_wins: number;
  total_overpay: number;
  avg_overpay: number;
}
export interface InflatedPlayer {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  inflation: number;
  purchase_price: number;
  market_price: number;
  buyer_id: string | null;
  buyer_name: string | null;
  buyer_color: number | null;
  transfer_id: number | null;
}
