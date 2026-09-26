import type { MarketRecommendation } from '../lib/market-recommendation';

/** Existing statistical response names are retained for browser/API compatibility. */
export interface MarketOpportunity {
  player_id: number;
  name: string | null;
  position: string | null;
  team_id: number | null;
  team: string | null;
  price: number;
  price_trend: number;
  avg_recent_points: number;
  recent_scores: string;
  value_score: number;
}

export interface CurrentMarketListing extends MarketRecommendation {
  player_id: number;
  name: string | null;
  img: string | null;
  position: string | null;
  team_id: number | null;
  team: string | null;
  team_img: string | null;
  real_price: number | null;
  recent_scores: string | null;
  min_points: number | string | null;
  max_points: number | string | null;
  games_played: number | string | null;
  seller_id: string | null;
  seller_name: string | null;
  seller_icon: string | null;
  seller_color: number | null;
  next_opponent_id: number | null;
  next_opponent_name: string | null;
  next_opponent_img: string | null;
  next_match_date: string | null;
  player_team: string | null;
}
