/** Query projections, deliberately independent from public view-model declarations. */
interface IdentityRecord extends Record<string, unknown> {
  user_id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
}
export interface FullStandingsRecord extends IdentityRecord {
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
export interface SimpleStandingsRecord extends IdentityRecord {
  total_points: number;
  team_value: string;
  price_trend: number;
  position: number;
}
export interface ValueRankingRecord extends IdentityRecord {
  team_value: string;
  price_trend: number;
  squad_size: number;
  value_position: number;
}
export interface LeagueOverviewRecords {
  pointsStats: { total_points: number | null; total_rounds: number; total_users: number };
  valueStats: {
    total_league_value: string | null;
    max_team_value: string | null;
    min_team_value: string | null;
  };
  seasonRounds: { total_season_rounds: number } | undefined;
  mostValuable:
    | {
        name: string | null;
        icon: string | null;
        color_index: number;
        team_value: string | null;
      }
    | undefined;
  roundRecord: (IdentityRecord & { round_name: string | null; points: number | null }) | undefined;
  leaderStreak: { streak: number };
}
