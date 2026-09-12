import 'server-only';
import type {
  TheoreticalGapStat,
  LeagueComparisonStat,
  RivalryMatrixStat,
  HeatmapStat,
  TheoreticalStandingsStat,
} from '../../models/theoretical';

export const mapTheoreticalGapStat = (row: TheoreticalGapStat): TheoreticalGapStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  current_points: row.current_points,
  perfectTotal: row.perfectTotal,
  gap: row.gap,
  pct: row.pct,
});

export const mapLeagueComparisonStat = (row: LeagueComparisonStat): LeagueComparisonStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  above_avg_count: row.above_avg_count,
  below_avg_count: row.below_avg_count,
  avg_diff: row.avg_diff,
});

export const mapTheoreticalStandingsStat = (
  row: TheoreticalStandingsStat
): TheoreticalStandingsStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  total_actual: row.total_actual,
  total_ideal: row.total_ideal,
  gap: row.gap,
  efficiency: row.efficiency,
  rounds_played: row.rounds_played,
});

export const mapHeatmapStat = (row: HeatmapStat): HeatmapStat => ({
  rounds: row.rounds.map((r) => ({ id: r.id, name: r.name, shortName: r.shortName })),
  users: row.users.map((u) => ({
    id: u.id,
    name: u.name,
    icon: u.icon,
    color_index: u.color_index,
    scores: u.scores.map((s) => s),
  })),
});
export const mapRivalryMatrixStat = (row: RivalryMatrixStat): RivalryMatrixStat => ({
  users: row.users.map((u) => ({
    id: u.id,
    name: u.name,
    icon: u.icon,
    color_index: u.color_index,
  })),
  matrix: Object.fromEntries(
    Object.entries(row.matrix).map(([id, opponents]) => [
      id,
      Object.fromEntries(
        Object.entries(opponents).map(([opponent, result]) => [
          opponent,
          { wins: result.wins, losses: result.losses, ties: result.ties },
        ])
      ),
    ])
  ),
});
