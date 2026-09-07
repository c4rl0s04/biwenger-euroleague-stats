import type {
  TheoreticalGapStat,
  LeagueComparisonStat,
  RivalryMatrixStat,
  HeatmapStat,
  TheoreticalStandingsStat,
} from '../../models/theoretical';
import type {
  TheoreticalGapStatRecord,
  LeagueComparisonStatRecord,
  RivalryMatrixStatRecord,
  HeatmapStatRecord,
  TheoreticalStandingsStatRecord,
} from '../queries/theoretical.records';

export const mapTheoreticalGapStat = (row: TheoreticalGapStatRecord): TheoreticalGapStat => row;
export const mapLeagueComparisonStat = (row: LeagueComparisonStatRecord): LeagueComparisonStat =>
  row;
export const mapRivalryMatrixStat = (row: RivalryMatrixStatRecord): RivalryMatrixStat => row;
export const mapHeatmapStat = (row: HeatmapStatRecord): HeatmapStat => row;
export const mapTheoreticalStandingsStat = (
  row: TheoreticalStandingsStatRecord
): TheoreticalStandingsStat => row;
