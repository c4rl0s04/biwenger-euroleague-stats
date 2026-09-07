/** Serializable, allowlisted compatibility models for the existing Rounds UI/API.
 * Snake-case names and optional fields are intentional existing HTTP contracts.
 */
export interface RoundOptionViewModel {
  round_id: number | null;
  round_name: string | null;
}
export interface RoundManagerViewModel {
  id: string;
  name: string | null;
  icon: string | null;
  color_index: number;
}
export interface RoundsListViewModel {
  rounds: RoundOptionViewModel[];
  users: RoundManagerViewModel[];
  defaultRoundId: number | null | undefined;
}
export interface RoundStandingViewModel extends RoundManagerViewModel {
  points: number;
  round_points: number;
  total_points: number;
  participated: boolean;
  past_total?: number | string | null;
  ideal_points: number;
}
export interface RoundLineupPlayerViewModel {
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
  points: number;
  is_missing: boolean;
  calculated: boolean;
  multiplier?: number;
}
export interface RoundLineupViewModel {
  players: RoundLineupPlayerViewModel[];
  summary: { total_points: number; round_rank: number; participated: boolean | null } | null;
}
export interface RoundCandidateViewModel {
  player_id: number;
  name: string | null;
  position: string | null;
  img: string | null;
  team_short: string | null;
  team_img: string | null;
  points: number | null;
  valuation?: number | null;
  team_id?: number | null;
}
export interface RoundOptimizedPlayerViewModel extends RoundCandidateViewModel {
  role: string;
  is_captain: boolean;
}
export interface RoundIdealPlayerViewModel extends RoundOptimizedPlayerViewModel {
  stats_points: number;
  multiplier: number;
}
export interface RoundIdealLineupViewModel {
  idealLineup: RoundIdealPlayerViewModel[];
  totalPoints: number;
}
export interface RoundOptimizationViewModel {
  optimalLineup: RoundOptimizedPlayerViewModel[];
  totalPoints: number;
}
export interface RoundCoachRatingViewModel {
  actualScore: number;
  maxScore: number;
  efficiency: number;
  idealLineup: RoundOptimizedPlayerViewModel[];
}
export interface RoundLeaderViewModel {
  id: number;
  name: string | null;
  img: string | null;
  position: string | null;
  team_name: string | null;
}
export interface RoundGlobalStatsViewModel {
  mvp: (RoundLeaderViewModel & { points: number | null; valuation: number | null }) | null;
  topScorer: (RoundLeaderViewModel & { stat_value: number | null }) | null;
  topRebounder: (RoundLeaderViewModel & { stat_value: number | null }) | null;
  topAssister: (RoundLeaderViewModel & { stat_value: number | null }) | null;
  avgScore: number;
  winner: { name: string | null; points: number | null; icon: string | null } | null;
}
export interface RoundDetailedManagerViewModel extends RoundStandingViewModel {
  lineup?: RoundLineupViewModel;
  idealLineup?: RoundOptimizedPlayerViewModel[];
  coachRating?: RoundCoachRatingViewModel | null;
  leftOut?: RoundCandidateViewModel[];
}
export interface RoundCompleteViewModel {
  global: RoundGlobalStatsViewModel;
  idealLineup: RoundIdealPlayerViewModel[];
  globalIdealPoints: number;
  users: RoundDetailedManagerViewModel[];
}
export interface RoundUserDetailsViewModel {
  global: RoundGlobalStatsViewModel;
  idealLineup: RoundIdealLineupViewModel;
  user: Partial<RoundOptimizationViewModel> & {
    coachRating: RoundCoachRatingViewModel | null;
    idealLineup?: RoundOptimizedPlayerViewModel[];
    leftOut: RoundCandidateViewModel[];
  };
}
export interface UserPerformanceHistory {
  round_id: number | null;
  round_number: number;
  round_name: string;
  actual_points: number;
  ideal_points: number;
  efficiency: number;
  participated: boolean | null;
}
export interface RoundLeaderboardViewModel {
  userId: string;
  avgEfficiency: string;
  totalLost: number;
  bestActual: number;
  bestActualRound: number | null;
  worstActual: number;
  worstActualRound: number | null;
  bestEfficiency: number;
  bestEffRound: number | null;
  worstEfficiency: number;
  worstEffRound: number | null;
  bestIdeal: number;
  bestIdealRoundNum: number | null;
  maxLost: number;
  maxLostRoundNum: number | null;
  roundsPlayed: number;
}
export interface AllUsersPerformanceHistoryViewModel {
  userId: string;
  history: UserPerformanceHistory[];
}
export interface FormationUsageViewModel {
  formation: string;
  count: number;
  percentage: number;
}
export interface LineupStatsViewModel {
  global: FormationUsageViewModel[];
  users: {
    userId: string;
    name: string | null;
    icon: string | null;
    color_index: number;
    favorite: FormationUsageViewModel | null;
    topFormations: FormationUsageViewModel[];
    totalRounds: number;
  }[];
}
