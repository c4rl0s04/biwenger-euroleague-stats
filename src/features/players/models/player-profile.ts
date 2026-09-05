export interface PlayerProfileMatchViewModel {
  round_id: number;
  round_name: string;
  match_date: string | null;
  home_team: string;
  home_img: string;
  away_team: string;
  away_img: string;
  home_id: number;
  away_id: number;
  home_score: number | null;
  away_score: number | null;
  fantasy_points: number;
  minutes_played: number;
  points_scored: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  two_points_made: number;
  two_points_attempted: number;
  three_points_made: number;
  three_points_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
  fouls_committed: number;
  valuation: number;
}

export interface PlayerPriceHistoryPointViewModel {
  date: string;
  price: number;
}

export interface PlayerTransferViewModel {
  date: string;
  from_name: string;
  to_name: string;
  amount: number;
  from_img: string | null;
  to_img: string | null;
  from_color: number | null;
  to_color: number | null;
  from_id: number | string | null;
  to_id: number | string | null;
}

export interface PlayerUpcomingMatchViewModel {
  date: string | null;
  // Kept absent at runtime because the current mobile presentation checks this
  // legacy alias and therefore renders its existing "Calendario pendiente" copy.
  match_date?: undefined;
  round_name: string;
  home_id: number;
  home_team: string;
  home_img: string;
  home_score: number | null;
  away_id: number;
  away_team: string;
  away_img: string;
  away_score: number | null;
  difficulty?: 'Fácil' | 'Normal' | 'Duro';
}

export interface PlayerAdvancedStatsViewModel {
  two_points_made: number;
  two_points_attempted: number;
  three_points_made: number;
  three_points_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
  blocks: number;
  turnovers: number;
  fouls: number;
  rebounds: number;
  assists: number;
  steals: number;
  minutes_played: number;
  points_scored: number;
  valuation: number;
  games_played: number;
  season_avg: number;
  best_real_points: number;
  worst_real_points: number;
  avg_real_points: number;
  avg_pir: number;
  ast_to_ratio: number;
  pts_per_40: number;
}

export interface PlayerProfileViewModel {
  id: number;
  name: string;
  position: string;
  puntos: number;
  partidos_jugados: number;
  played_home: number;
  played_away: number;
  points_home: number;
  points_away: number;
  points_last_season: number;
  status: string | null;
  price_increment: number;
  birth_date: string | null;
  height: number | null;
  weight: number | null;
  price: number;
  euroleague_code: string | null;
  dorsal: string | null;
  country: string | null;
  profile_url: string | null;
  team_id: number;
  img: string;
  owner_id: number | string | null;
  owner_name: string | null;
  owner_color_index: number;
  owner_icon: string | null;
  games_played: number;
  season_avg: number;
  total_points: number;
  best_real_points: number;
  worst_real_points: number;
  best_fantasy: number;
  worst_fantasy: number;
  team_name: string;
  team_img: string;
  team_code: string;
  team_total_matches: number;
  player_total_matches: number;
  playoff_probability: number;
  recentMatches: PlayerProfileMatchViewModel[];
  priceHistory: PlayerPriceHistoryPointViewModel[];
  transfers: PlayerTransferViewModel[];
  nextMatch: PlayerUpcomingMatchViewModel | null;
  nextMatches: PlayerUpcomingMatchViewModel[];
  advancedStats: PlayerAdvancedStatsViewModel;
}

export type PlayerProfileApiModel = Omit<
  PlayerProfileViewModel,
  'games_played' | 'season_avg' | 'total_points' | 'advancedStats'
> & {
  // These PostgreSQL aggregate fields have historically been JSON strings.
  games_played: string;
  season_avg: string;
  total_points: string;
  advancedStats: Omit<PlayerAdvancedStatsViewModel, 'season_avg'> & {
    season_avg: string;
  };
};

export interface PlayerPerformanceSummaryViewModel {
  playerId: number;
  name: string;
  team: string;
  recentAverage: number;
  formStatus: 'excellent' | 'good' | 'average' | 'poor';
  gamesPlayed: number;
  totalPoints: number;
  advancedStats: PlayerAdvancedStatsViewModel;
}

export type PlayerProfileSection = 'performance' | 'market' | 'history';
