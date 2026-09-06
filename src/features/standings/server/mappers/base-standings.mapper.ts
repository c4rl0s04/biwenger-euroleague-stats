import type {
  FullStandingsEntry,
  SimpleStandingsEntry,
  ValueRankingEntry,
  LeagueOverview,
} from '../../models/base-standings';
import type {
  FullStandingsRecord,
  SimpleStandingsRecord,
  ValueRankingRecord,
  LeagueOverviewRecords,
} from '../queries/base-standings.records';

export function mapFullStandings(row: FullStandingsRecord): FullStandingsEntry {
  return {
    user_id: row.user_id,
    name: row.name,
    icon: row.icon,
    color_index: row.color_index,
    total_points: row.total_points,
    rounds_played: row.rounds_played,
    avg_points: row.avg_points,
    best_round: row.best_round,
    worst_round: row.worst_round,
    round_wins: row.round_wins,
    team_value: row.team_value,
    price_trend: row.price_trend,
    position: row.position,
  };
}
export function mapSimpleStandings(row: SimpleStandingsRecord): SimpleStandingsEntry {
  return {
    user_id: row.user_id,
    name: row.name,
    icon: row.icon,
    color_index: row.color_index,
    total_points: row.total_points,
    team_value: row.team_value,
    price_trend: row.price_trend,
    position: row.position,
  };
}
export function mapValueRanking(row: ValueRankingRecord): ValueRankingEntry {
  return {
    user_id: row.user_id,
    name: row.name,
    icon: row.icon,
    color_index: row.color_index,
    team_value: row.team_value,
    price_trend: row.price_trend,
    squad_size: row.squad_size,
    value_position: row.value_position,
  };
}
export function mapLeagueOverview(records: LeagueOverviewRecords): LeagueOverview {
  const { pointsStats, valueStats, seasonRounds, mostValuable, roundRecord, leaderStreak } =
    records;
  return {
    total_points: pointsStats.total_points,
    total_rounds: pointsStats.total_rounds,
    total_users: pointsStats.total_users,
    total_league_value: valueStats.total_league_value,
    max_team_value: valueStats.max_team_value,
    min_team_value: valueStats.min_team_value,
    // SQL SUM can be null. JavaScript previously coerced it to zero in this division.
    avg_round_points:
      pointsStats.total_rounds > 0
        ? Number(
            (
              (pointsStats.total_points === null ? 0 : pointsStats.total_points) /
              pointsStats.total_rounds /
              (pointsStats.total_users || 1)
            ).toFixed(1)
          )
        : 0,
    total_season_rounds: seasonRounds?.total_season_rounds || 34,
    most_valuable_user: mostValuable && {
      name: mostValuable.name,
      icon: mostValuable.icon,
      color_index: mostValuable.color_index,
      team_value: mostValuable.team_value,
    },
    round_record: roundRecord && {
      user_id: roundRecord.user_id,
      name: roundRecord.name,
      icon: roundRecord.icon,
      color_index: roundRecord.color_index,
      round_name: roundRecord.round_name,
      points: roundRecord.points,
    },
    winner_streak: Number(leaderStreak.streak) || 0,
  };
}
