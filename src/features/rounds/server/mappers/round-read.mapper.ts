import type * as Rows from '../../models/round-query-contracts';
import type * as Models from '../../models/round-read';
import type { ManagerDirectoryRow } from '../queries/directory.query';

export function mapRoundManager(row: ManagerDirectoryRow): Models.RoundManagerViewModel {
  return { id: row.id, name: row.name, icon: row.icon, color_index: row.color_index };
}
export function mapRoundOption(row: Rows.RoundOptionRow): Models.RoundOptionViewModel {
  return { round_id: row.round_id, round_name: row.round_name };
}
export function mapRoundStanding(
  row: Rows.RoundStanding,
  idealPoints: number
): Models.RoundStandingViewModel {
  return {
    ...mapRoundManager(row),
    points: row.points,
    round_points: row.round_points,
    total_points: row.total_points,
    participated: row.participated,
    ...('past_total' in row ? { past_total: row.past_total } : {}),
    ideal_points: idealPoints,
  };
}
export function mapRoundLineup(data: Rows.UserLineup): Models.RoundLineupViewModel {
  return {
    players: data.players.map((p) => ({
      player_id: p.player_id,
      name: p.name,
      position: p.position,
      img: p.img,
      team: p.team,
      team_short: p.team_short,
      team_img: p.team_img,
      is_captain: p.is_captain,
      role: p.role,
      raw_points: p.raw_points,
      valuation: p.valuation,
      stats_points: p.stats_points,
      stats_rebounds: p.stats_rebounds,
      stats_assists: p.stats_assists,
      minutes: p.minutes,
      current_status: p.current_status,
      player_exists: p.player_exists,
      points: p.points,
      is_missing: p.is_missing,
      calculated: p.calculated,
    })),
    summary: data.summary
      ? {
          total_points: data.summary.total_points,
          round_rank: data.summary.round_rank,
          participated: data.summary.participated,
        }
      : null,
  };
}
export function mapRoundCandidate(p: Rows.SquadPlayerRow): Models.RoundCandidateViewModel {
  return {
    player_id: p.player_id,
    name: p.name,
    position: p.position,
    img: p.img,
    team_short: p.team_short,
    team_img: p.team_img,
    points: p.points,
  };
}
export function mapRoundOptimizedPlayer(
  p: Rows.OptimizedPlayer
): Models.RoundOptimizedPlayerViewModel {
  return {
    ...mapRoundCandidate(p),
    valuation: p.valuation,
    role: p.role,
    is_captain: p.is_captain,
  };
}
export function mapRoundIdeal(data: Rows.IdealLineupResult): Models.RoundIdealLineupViewModel {
  return {
    idealLineup: data.idealLineup.map((p) => ({
      ...mapRoundOptimizedPlayer(p),
      team_id: p.team_id,
      stats_points: p.stats_points,
      multiplier: p.multiplier,
    })),
    totalPoints: data.totalPoints,
  };
}
export function mapRoundOptimization(
  data: Rows.OptimizationResult
): Models.RoundOptimizationViewModel {
  return {
    optimalLineup: data.optimalLineup.map(mapRoundOptimizedPlayer),
    totalPoints: data.totalPoints,
  };
}
export function mapRoundCoach(
  data: Rows.CoachRating | null
): Models.RoundCoachRatingViewModel | null {
  return data
    ? {
        actualScore: data.actualScore,
        maxScore: data.maxScore,
        efficiency: data.efficiency,
        idealLineup: data.idealLineup.map(mapRoundOptimizedPlayer),
      }
    : null;
}
function mapLeader(p: Rows.StatPlayerRow): Models.RoundLeaderViewModel {
  return { id: p.id, name: p.name, img: p.img, position: p.position, team_name: p.team_name };
}
function mapStatLeader(p: Rows.StatLeaderRow | null) {
  return p ? { ...mapLeader(p), stat_value: p.stat_value } : null;
}
export function mapRoundGlobal(data: Rows.RoundGlobalStats): Models.RoundGlobalStatsViewModel {
  return {
    mvp: data.mvp
      ? { ...mapLeader(data.mvp), points: data.mvp.points, valuation: data.mvp.valuation }
      : null,
    topScorer: mapStatLeader(data.topScorer),
    topRebounder: mapStatLeader(data.topRebounder),
    topAssister: mapStatLeader(data.topAssister),
    avgScore: data.avgScore,
    winner: data.winner
      ? { name: data.winner.name, points: data.winner.points, icon: data.winner.icon }
      : null,
  };
}
