import type {
  RoundWinner,
  PointsProgression,
  StreakStat,
  PlacementStat,
} from '../../models/progression';
import type {
  RoundWinnerRecord,
  PointsProgressionRecord,
  StreakStatRecord,
  PlacementStatRecord,
} from '../queries/progression.records';

export const mapRoundWinner = (row: RoundWinnerRecord): RoundWinner => ({
  round_id: row.round_id,
  round_name: row.round_name,
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  points: row.points,
});

export const mapPointsProgression = (row: PointsProgressionRecord): PointsProgression => ({
  user_id: row.user_id,
  name: row.name,
  color_index: row.color_index,
  round_id: row.round_id,
  round_name: row.round_name,
  points: row.points,
  cumulative_points: row.cumulative_points,
});

export const mapStreakStat = (row: StreakStatRecord): StreakStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  longest_streak: row.longest_streak,
  current_streak: row.current_streak,
});

export const mapPlacementStat = (row: PlacementStatRecord): PlacementStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  top_3_count: row.top_3_count,
  bottom_3_count: row.bottom_3_count,
  total_rounds: row.total_rounds,
});
