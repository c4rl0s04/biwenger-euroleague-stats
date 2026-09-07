/** Explicit persistence/result contracts. Public screen models are mapped separately. */
export interface RoundOptionRow {
  round_id: number | null;
  round_name: string | null;
}
export interface LineupRow {
  player_id: number;
  name: string;
  position: string;
  img: string | null;
  team: string;
  team_short: string | null;
  team_img: string | null;
  is_captain: boolean | null;
  role: string | null;
  raw_points: number | null;
  valuation: number;
  stats_points: number;
  stats_rebounds: number;
  stats_assists: number;
  minutes: number | null;
  current_status: string | null;
  player_exists: number | null;
}
export interface LineupPlayer extends LineupRow {
  points: number;
  is_missing: boolean;
  calculated: boolean;
}
export interface UserLineup {
  players: LineupPlayer[];
  summary: { total_points: number; round_rank: number; participated: boolean | null } | null;
}
export interface LineupTotalsRow {
  points: number | null;
  participated: boolean | null;
  position: string;
}
export interface StandingRow {
  id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
  round_points: number | string | null;
  total_points?: number | string | null;
  past_total?: number | string | null;
  participated: boolean | number | null;
}
export interface RoundStanding {
  id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
  points: number;
  round_points: number;
  total_points: number;
  participated: boolean;
  past_total?: number | string | null;
}
export interface StatPlayerRow {
  id: number;
  name: string | null;
  img: string | null;
  position: string | null;
  team_name: string | null;
}
export interface MvpRow extends StatPlayerRow {
  points: number | null;
  valuation: number | null;
}
export interface StatLeaderRow extends StatPlayerRow {
  stat_value: number | null;
}
export interface WinnerRow {
  name: string | null;
  points: number | null;
  icon: string | null;
}
export interface RoundGlobalStats {
  mvp: MvpRow | null;
  topScorer: StatLeaderRow | null;
  topRebounder: StatLeaderRow | null;
  topAssister: StatLeaderRow | null;
  avgScore: number;
  winner: WinnerRow | null;
}
export interface SquadPlayerRow {
  player_id: number;
  name: string | null;
  position: string | null;
  img: string | null;
  team_short: string | null;
  team_img: string | null;
  points: number | null;
}
export interface OptimizationPlayerRow extends SquadPlayerRow {
  valuation: number | null;
}
export interface IdealPlayerRow extends OptimizationPlayerRow {
  team_id: number | null;
}
export interface OptimizedPlayer extends OptimizationPlayerRow {
  role: string;
  is_captain: boolean;
}
export interface IdealPlayer extends IdealPlayerRow {
  role: 'titular' | '6th_man' | 'bench';
  is_captain: boolean;
  stats_points: number;
  multiplier: number;
}
export interface IdealLineupResult {
  idealLineup: IdealPlayer[];
  totalPoints: number;
}
export interface OptimizationResult {
  optimalLineup: OptimizedPlayer[];
  totalPoints: number;
}
export interface RoundHistoryRow {
  round_id: number | null;
  actual_points: number | null;
  participated: boolean | null;
  round_name: string | null;
}
export interface FormationRow {
  alineacion: string;
  count: number;
}
export interface UserFormationRow extends FormationRow {
  user_id: string | null;
  total_count: number;
  formation_rank: string;
}
export interface LineupUsageResult {
  global: FormationRow[];
  byUser: UserFormationRow[];
}
export interface CoachRating {
  actualScore: number;
  maxScore: number;
  efficiency: number;
  idealLineup: OptimizedPlayer[];
}
