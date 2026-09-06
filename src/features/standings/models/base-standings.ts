/** Explicit public statistical DTOs. Snake-case and bigint strings are existing HTTP contracts. */
export interface StandingsOptions {
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface StandingsIdentity {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
}

export interface FullStandingsEntry extends StandingsIdentity {
  total_points: number;
  rounds_played: number;
  avg_points: number;
  best_round: number;
  worst_round: number;
  round_wins: number;
  team_value: number;
  price_trend: number;
  position: number;
}

export interface SimpleStandingsEntry extends StandingsIdentity {
  total_points: number;
  team_value: string;
  price_trend: number;
  position: number;
}

export interface ValueRankingEntry extends StandingsIdentity {
  team_value: string;
  price_trend: number;
  squad_size: number;
  value_position: number;
}

export interface LeagueOverview {
  total_points: number | null;
  total_rounds: number;
  total_users: number;
  total_league_value: string | null;
  max_team_value: string | null;
  min_team_value: string | null;
  avg_round_points: number;
  total_season_rounds: number;
  most_valuable_user?: {
    name: string | null;
    icon: string | null;
    color_index: number;
    team_value: string | null;
  };
  round_record?: StandingsIdentity & { round_name: string | null; points: number | null };
  winner_streak: number;
}
