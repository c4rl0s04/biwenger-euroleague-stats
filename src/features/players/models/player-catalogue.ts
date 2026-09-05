export interface PlayerCatalogueItemViewModel {
  id: number;
  name: string;
  img: string;
  position: string;
  price: number;
  price_increment: number;
  team_id: number | null;
  team_name: string;
  team_short_name: string;
  team_code: string;
  team_img: string;
  team?: undefined;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number;
  owner_icon: string | null;
  total_points: number;
  played: number;
  average: number;
  best_score: number;
  worst_score: number;
  recent_scores: string | null;
  avg_form_score: number;
  avg_points?: undefined;
  season_avg?: undefined;
  status: string | null;
}

export interface PlayerStreakItemViewModel {
  id: number;
  name: string;
  team_id: number | null;
  team_name: string;
  position: string;
  games: number;
  recent_avg: number;
  season_avg: number;
  avg_diff: number;
  trend_pct: number;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number;
}

export interface PlayerStreaksViewModel {
  hot: PlayerStreakItemViewModel[];
  cold: PlayerStreakItemViewModel[];
}

export interface PlayerCatalogueInsightsViewModel {
  topPerformers: PlayerTopPerformerViewModel[];
  streaks: PlayerStreaksViewModel;
}

export type PlayerCatalogueSection = 'insights' | 'squads';
import type { PlayerTopPerformerViewModel } from './player-insights';
