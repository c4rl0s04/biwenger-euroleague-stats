export interface BestRevaluationRecord {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  team_name: string | null;
  team_logo: string | null;
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  current_price: number | string | null;
  purchase_price: number | string | null;
  revaluation: number | string | null;
}
export interface BestValuePlayerRecord {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  transfer_id: number | null;
  purchase_price: number | string | null;
  total_points: number | string | null;
  points_per_million: number | string | null;
}
export interface InfirmaryPlayerRecord {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  purchase_price: number | string | null;
  available_rounds: number | string | null;
  played_rounds: number | string | null;
  missed_rounds: number | string | null;
}
export interface SingleFlipRecord {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  purchase_price: number | string | null;
  sale_price: number | string | null;
  profit: number | string | null;
}
export interface PercentageGainRecord {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  current_price: number | string | null;
  purchase_price: number | string | null;
  percentage_gain: number | string | null;
}
export interface MissedOpportunityRecord {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  sale_price: number | string | null;
  current_price: number | string | null;
  is_repurchase: boolean | null;
  missed_profit: number | string | null;
}
export interface TopTraderRecord {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  trade_count: number | string | null;
  total_profit: number | string | null;
}
export interface ProfitablePlayerRecord {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  trade_count: number | string | null;
  total_profit: number | string | null;
}
export interface LossyPlayerRecord {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  trade_count: number | string | null;
  total_loss: number | string | null;
}
export interface QuickFlipRecord {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  purchase_price: number | string | null;
  sale_price: number | string | null;
  profit: number | string | null;
  hours_held: number | string | null;
}
export interface LongHoldRecord {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  purchase_price: number | string | null;
  sale_price: number | string | null;
  profit: number | string | null;
  days_held: number | string | null;
}
export interface DevaluationRecord {
  user_id: string | null;
  user_name: string | null;
  user_color_index: number | null;
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  team_name: string | null;
  team_logo: string | null;
  current_price: number | string | null;
  purchase_price: number | string | null;
  devaluation: number | string | null;
}
