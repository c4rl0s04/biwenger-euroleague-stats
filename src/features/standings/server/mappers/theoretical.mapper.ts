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

export const mapTheoreticalGapStat = (row: any): TheoreticalGapStat => ({
  user_id: Number(row.user_id),
  name: String(row.name),
  icon: row.icon ? String(row.icon) : '',
  color_index: Number(row.color_index),
  current_points: Number(row.current_points),
  perfectTotal: Number(row.perfectTotal),
  gap: Number(row.gap),
  pct: Number(row.pct),
});

export const mapLeagueComparisonStat = (row: LeagueComparisonStatRecord): LeagueComparisonStat =>
  row;

export const mapRivalryMatrixStat = (row: any): RivalryMatrixStat => ({
  users: Array.isArray(row?.users)
    ? row.users.map((u: any) => ({
        id: Number(u.id),
        name: String(u.name),
        icon: u.icon ? String(u.icon) : '',
        color_index: Number(u.color_index),
      }))
    : [],
  matrix: row?.matrix || {},
});

export const mapHeatmapStat = (row: any): HeatmapStat => ({
  rounds: Array.isArray(row?.rounds)
    ? row.rounds.map((r: any) => ({
        id: Number(r.id),
        name: String(r.name),
        shortName: r.shortName ? String(r.shortName) : undefined,
      }))
    : [],
  users: Array.isArray(row?.users)
    ? row.users.map((u: any) => ({
        id: Number(u.id),
        name: String(u.name),
        icon: u.icon ? String(u.icon) : '',
        color_index: Number(u.color_index),
        scores: Array.isArray(u.scores)
          ? u.scores.map((s: any) => (s !== null ? Number(s) : null))
          : [],
      }))
    : [],
});

export const mapTheoreticalStandingsStat = (
  row: TheoreticalStandingsStatRecord
): TheoreticalStandingsStat => row;
