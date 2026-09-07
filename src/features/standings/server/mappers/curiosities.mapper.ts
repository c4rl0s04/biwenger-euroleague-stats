import type {
  BottlerStat,
  HeartbreakerStat,
  NoGloryStat,
  JinxStat,
  EfficiencyStat,
  DetailedCaptainStat,
} from '../../models/curiosities';
import type {
  BottlerStatRecord,
  HeartbreakerStatRecord,
  NoGloryStatRecord,
  JinxStatRecord,
  EfficiencyStatRecord,
  DetailedCaptainStatRecord,
} from '../queries/curiosities.records';

export const mapBottlerStat = (row: BottlerStatRecord): BottlerStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  wins: row.wins,
  seconds: row.seconds,
  thirds: row.thirds,
  bottler_score: row.bottler_score,
});

export const mapHeartbreakerStat = (row: HeartbreakerStatRecord): HeartbreakerStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  count: row.count,
  total_diff: row.total_diff,
});

export const mapNoGloryStat = (row: NoGloryStatRecord): NoGloryStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  total_points_no_glory: row.total_points_no_glory,
  rounds_count: row.rounds_count,
});

export const mapJinxStat = (row: JinxStatRecord): JinxStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  jinxed_count: row.jinxed_count,
});

export const mapEfficiencyStat = (row: EfficiencyStatRecord): EfficiencyStat => ({
  user_id: row.user_id,
  name: row.name,
  icon: row.icon,
  color_index: row.color_index,
  total_points: row.total_points,
  team_value: row.team_value,
  points_per_million: row.points_per_million,
});

export const mapDetailedCaptainStat = (row: DetailedCaptainStatRecord): DetailedCaptainStat => ({
  user_id: row.user_id,
  user_name: row.user_name,
  user_icon: row.user_icon,
  color_index: row.color_index,
  total_rounds: row.total_rounds,
  total_captain_points: row.total_captain_points,
  avg_captain_points: row.avg_captain_points,
  success_rate: row.success_rate,
  unique_captains: row.unique_captains,
  best_points: row.best_points,
  worst_points: row.worst_points,
  most_used_captain: row.most_used_captain,
  most_used_captain_id: row.most_used_captain_id,
});
