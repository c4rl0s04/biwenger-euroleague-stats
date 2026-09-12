// Explicit serializable projection contracts; no untyped database records cross this boundary.
export type {
  RoundWinner as RoundWinnerRecord,
  PointsProgression as PointsProgressionRecord,
  StreakStat as StreakStatRecord,
  PlacementStat as PlacementStatRecord,
} from '../../models/progression';
