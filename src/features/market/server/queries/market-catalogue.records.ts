export interface MarketOpportunityRecord {
  player_id: number;
  name: string | null;
  position: string | null;
  team_id: number | null;
  team: string | null;
  price: number;
  price_trend: number;
}

export interface MarketListingRecord extends MarketOpportunityRecord {
  img: string | null;
  team_img: string | null;
  real_price: number | null;
  total_points: number | string;
  season_avg: number | string;
  min_points: number | string | null;
  max_points: number | string | null;
  games_played: number | string | null;
  seller_id: string | null;
  seller_name: string | null;
  seller_icon: string | null;
  seller_color: number | null;
  player_team: string | null;
  next_opponent_id: number | null;
  next_opponent_name: string | null;
  next_opponent_img: string | null;
  next_match_date: Date | string | null;
}
