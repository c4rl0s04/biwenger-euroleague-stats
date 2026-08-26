import { db } from '../../client';
import { resolveReadSeasonId } from '../../season-context';

export interface OfficialGameFilters {
  period?: number;
  teamCode?: string;
  playerId?: number;
}

async function resolveGame(matchId: number, seasonId: string) {
  return (
    await (db as any).query(
      `SELECT m.id,m.status,m.date,m.official_game_code,og.finalized_at
       FROM matches m
       LEFT JOIN official_games og
         ON og.season_id=m.season_id AND og.game_code=m.official_game_code
       WHERE m.id=$1 AND m.season_id=$2`,
      [matchId, seasonId]
    )
  ).rows[0];
}

function filtersSql(filters: OfficialGameFilters, values: unknown[]) {
  const clauses: string[] = [];
  if (filters.period != null) {
    values.push(filters.period);
    clauses.push(`d.period=$${values.length}`);
  }
  if (filters.teamCode) {
    values.push(filters.teamCode);
    clauses.push(`d.team_code=$${values.length}`);
  }
  if (filters.playerId != null) {
    values.push(filters.playerId);
    clauses.push(`pm.player_id=$${values.length}`);
  }
  return clauses.length ? ` AND ${clauses.join(' AND ')}` : '';
}

export async function getOfficialPlayByPlay(
  matchId: number,
  filters: OfficialGameFilters,
  requestedSeasonId?: string
) {
  const seasonId = await resolveReadSeasonId(requestedSeasonId);
  const game = await resolveGame(matchId, seasonId);
  if (!game?.official_game_code) return null;
  const values: unknown[] = [seasonId, game.official_game_code];
  const where = filtersSql(filters, values);
  const items = (
    await (db as any).query(
      `SELECT d.sequence,d.provider_play_number,d.period,d.minute,d.marker_time,d.play_type,
              d.team_code,d.provider_player_code,pm.player_id,d.player_name,d.team_name,d.dorsal,
              d.home_score,d.away_score,d.comment,d.play_info
       FROM official_play_by_play d
       LEFT JOIN official_player_mappings pm
         ON pm.season_id=d.season_id AND pm.provider_player_code=d.provider_player_code
        AND pm.provider='euroleague_advanced' AND pm.status='matched'
       WHERE d.season_id=$1 AND d.game_code=$2${where}
       ORDER BY d.sequence`,
      values
    )
  ).rows;
  return {
    match: { id: game.id, status: game.status },
    scheduledAt: game.date,
    finalizedAt: game.finalized_at,
    items,
  };
}

export async function getOfficialShots(
  matchId: number,
  filters: OfficialGameFilters,
  requestedSeasonId?: string
) {
  const seasonId = await resolveReadSeasonId(requestedSeasonId);
  const game = await resolveGame(matchId, seasonId);
  if (!game?.official_game_code) return null;
  const values: unknown[] = [seasonId, game.official_game_code];
  const clauses: string[] = [];
  if (filters.period != null) {
    // The provider exposes minute, not an explicit period, for shot data.
    const start = (filters.period - 1) * 10;
    const end = filters.period * 10;
    values.push(start, end);
    clauses.push(`d.minute>$${values.length - 1} AND d.minute<=$${values.length}`);
  }
  if (filters.teamCode) {
    values.push(filters.teamCode);
    clauses.push(`d.team_code=$${values.length}`);
  }
  if (filters.playerId != null) {
    values.push(filters.playerId);
    clauses.push(`pm.player_id=$${values.length}`);
  }
  const where = clauses.length ? ` AND ${clauses.join(' AND ')}` : '';
  const items = (
    await (db as any).query(
      `SELECT d.annotation_number,d.team_code,d.provider_player_code,pm.player_id,d.player_name,
              d.action_id,d.action,d.points,d.coordinate_x,d.coordinate_y,d.zone,
              d.is_fastbreak,d.is_second_chance,d.is_points_off_turnover,d.minute,
              d.marker_time,d.home_score,d.away_score,d.occurred_at
       FROM official_shots d
       LEFT JOIN official_player_mappings pm
         ON pm.season_id=d.season_id AND pm.provider_player_code=d.provider_player_code
        AND pm.provider='euroleague_advanced' AND pm.status='matched'
       WHERE d.season_id=$1 AND d.game_code=$2${where}
       ORDER BY d.annotation_number`,
      values
    )
  ).rows;
  return {
    match: { id: game.id, status: game.status },
    scheduledAt: game.date,
    finalizedAt: game.finalized_at,
    items,
  };
}
