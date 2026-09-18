export interface TopTransferredPlayerRecord {
  player_id: number | null;
  name: string | null;
  img: string | null;
  player_team: string | null;
  transfer_count: number | string | null;
  avg_price: number | string | null;
  owner_id: string | null;
  owner_name: string | null;
  owner_color_index: number | null;
}
export interface EnrichedTransferRecord {
  id: number | null;
  season_id: string | null;
  timestamp: number | string | null;
  fecha: string | null;
  player_id: number | null;
  precio: number | string | null;
  vendedor: string | null;
  comprador: string | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  team_name: string | null;
  team_logo: string | null;
  buyer_id: string | null;
  buyer_name: string | null;
  buyer_icon: string | null;
  buyer_color: number | null;
  seller_id: string | null;
  seller_name: string | null;
  seller_icon: string | null;
  seller_color: number | null;
}
export interface BigSpenderRecord {
  name: string | null;
  user_id: string | null;
  user_color_index: number | null;
  total_spent: number | string | null;
  purchases_count: number | string | null;
}
export interface BestSellerRecord {
  name: string | null;
  user_id: string | null;
  user_color_index: number | null;
  net_profit: number | string | null;
  total_sales: number | string | null;
  sales_count: number | string | null;
}
export interface MostOwnersPlayerRecord {
  player_id: number | null;
  player_name: string | null;
  player_img: string | null;
  player_team: string | null;
  team_name: string | null;
  team_logo: string | null;
  distinct_owners_count: number | string | null;
  owner_id: string | null;
  owner_name: string | null;
  owner_color_index: number | null;
}
export interface ManagerMarketStatsRecord {
  user_id: string | null;
  user_icon: string | null;
  color_index: number | null;
  user_name: string | null;
  purchases_count: number | string | null;
  purchases_total: number | string | null;
  sales_count: number | string | null;
  sales_total: number | string | null;
}
