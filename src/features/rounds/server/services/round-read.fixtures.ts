import type {
  RoundStanding,
  RoundGlobalStats,
  UserLineup,
  IdealLineupResult,
  CoachRating,
  RoundHistoryRow,
} from '../../models/round-query-contracts';

export const manager = { id: '7', name: 'Fixture Manager', icon: null, color_index: 2 };
export const standing: RoundStanding = {
  ...manager,
  points: 24,
  round_points: 24,
  total_points: 90,
  participated: false,
  past_total: '66',
};
export const globalStats: RoundGlobalStats = {
  mvp: null,
  topScorer: null,
  topRebounder: null,
  topAssister: null,
  avgScore: 0,
  winner: null,
};
export const lineup: UserLineup = {
  players: [],
  summary: { total_points: 24, round_rank: 2, participated: false },
};
export const ideal: IdealLineupResult = { idealLineup: [], totalPoints: 40 };
export const coach: CoachRating = {
  actualScore: 24,
  maxScore: 40,
  efficiency: 60,
  idealLineup: [],
};
export const historyRow: RoundHistoryRow = {
  round_id: 2,
  round_name: 'Jornada 2',
  actual_points: 24,
  participated: false,
};
