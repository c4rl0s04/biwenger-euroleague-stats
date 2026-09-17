export interface RecordBidRecord {
  transfer_id: number | null;
  bid_count: number | string | null;
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
export interface TheThiefRecord {
  name: string | null;
  user_id: string | null;
  user_color_index: number | null;
  stolen_count: number | string | null;
}
export interface BiggestStealRecord {
  transfer_id: number | null;
  winning_price: number | string | null;
  winner: string | null;
  winner_id: string | null;
  winner_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  second_highest_bid: number | string | null;
  second_bidder_name: string | null;
  price_diff: number | string | null;
}
export interface TheVictimRecord {
  name: string | null;
  user_id: string | null;
  user_color_index: number | null;
  failed_bids_count: number | string | null;
}
export interface OverpayerManagerRecord {
  name: string | null;
  user_id: string | null;
  user_color_index: number | null;
  contested_wins: number | string | null;
  total_overpay: number | string | null;
  avg_overpay: number | string | null;
}
export interface InflatedPlayerRecord {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  inflation: number | string | null;
  purchase_price: number | string | null;
  market_price: number | string | null;
  buyer_id: string | null;
  buyer_name: string | null;
  buyer_color: number | null;
  transfer_id: number | null;
}
