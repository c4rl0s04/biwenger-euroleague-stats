// Explicit serializable projection contracts; no untyped database records cross this boundary.
export type {
  TheoreticalGapStat as TheoreticalGapStatRecord,
  LeagueComparisonStat as LeagueComparisonStatRecord,
  RivalryMatrixStat as RivalryMatrixStatRecord,
  HeatmapStat as HeatmapStatRecord,
  TheoreticalStandingsStat as TheoreticalStandingsStatRecord,
} from '../../models/theoretical';
