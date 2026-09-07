export interface DraftPerformanceViewModel {
  user_id: string;
  user_name: string | null;
  user_color_index: number;
  icon: string | null;
  actual_points: number;
  potential_points: number;
  roi_percentage: number;
}
export interface DraftPlayerViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  player_name: string;
  player_id: number;
  total_fantasy_points: number;
}
export interface DraftRetainedPointsViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  players_contributed: number;
  total_points: number;
}
export interface DraftPlayerBreakdownViewModel {
  user_id: string;
  user_name: string;
  icon: string | null;
  player_name: string;
  points: number;
}
export interface DraftRegretViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  points_lost: number;
  top_regret_player: string;
}
export interface DraftLoyaltyViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  retained_count: number;
  initial_count: number;
  loyalty_percentage: number;
}
export interface DraftPotentialViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  total_points: number;
  total_value: number;
}
export interface DraftDetailedViewModel {
  user_id: string | number;
  manager_name: string;
  manager_color_index: number;
  player_id: number;
  player_name: string;
  player_position: string;
  current_points: number;
  current_price: number;
  current_owner_id: string | number | null;
  current_owner: string | null;
}
export type DraftAnalyticsViewModel = DraftPerformanceViewModel[];
export interface DraftStatsBundleViewModel {
  bestDraftPerUser: DraftPlayerViewModel[];
  retainedRanking: DraftRetainedPointsViewModel[];
  retainedBreakdown: DraftPlayerBreakdownViewModel[];
  regretRanking: DraftRegretViewModel[];
  loyaltyRanking: DraftLoyaltyViewModel[];
  potentialRanking: DraftPotentialViewModel[];
  detailedSquads: DraftDetailedViewModel[];
}
