export interface BestRevaluation {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  team_name: string | null;
  team_logo: string | null;
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  current_price: number;
  purchase_price: number;
  revaluation: number;
}
export interface BestValuePlayer {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  transfer_id: number | null;
  purchase_price: number;
  total_points: number;
  points_per_million: number;
}
export interface InfirmaryPlayer {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  purchase_price: number;
  available_rounds: number;
  played_rounds: number;
  missed_rounds: number;
}
export interface SingleFlip {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  purchase_price: number;
  sale_price: number;
  profit: number;
}
export interface PercentageGain {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  current_price: number;
  purchase_price: number;
  percentage_gain: number;
}
export interface MissedOpportunity {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  sale_price: number;
  current_price: number;
  is_repurchase: boolean;
  missed_profit: number;
}
export interface TopTrader {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  trade_count: number;
  total_profit: number;
}
export interface ProfitablePlayer {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  trade_count: number;
  total_profit: number;
}
/** Legacy union projection retained for callers until their type imports move. */
export type PlayerProfitability = Omit<ProfitablePlayer, 'total_profit'> & {
  total_profit?: number;
  total_loss?: number;
};
export interface LossyPlayer {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  trade_count: number;
  total_loss: number;
}
export interface QuickFlip {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  purchase_price: number;
  sale_price: number;
  profit: number;
  hours_held: number;
}
export interface LongHold {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  purchase_price: number;
  sale_price: number;
  profit: number;
  days_held: number;
}
export interface Devaluation {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  team_name: string | null;
  team_logo: string | null;
  current_price: number;
  purchase_price: number;
  devaluation: number;
}
