import 'server-only';

import type { Pool, PoolClient } from 'pg';
import { pool } from '@/lib/db/client';
import type { PostseasonGame } from '../../models/bracket';

const database = pool as Pool;
type Connection = Pool | PoolClient;

export interface PostseasonSeedRow {
  seed: number;
  teamCode: string;
  /** null when the official team code has no mapping for this season. */
  teamId: string | null;
  name: string;
  image: string | null;
}

export interface PostseasonGameRow extends PostseasonGame {
  gameCode: number;
  scheduledAt: Date | null;
}

export interface PostseasonReadiness {
  now: Date;
  regularSeasonGames: number;
  regularSeasonUnplayed: number;
  playInGames: number;
  playInPlayed: number;
  firstPlayInTipOff: Date | null;
}

// master-data stores standings only for regular-season gamedays, so the latest round is the final RS table.
const SEEDS = `SELECT ots.position AS seed, ots.team_code, otm.team_id::text AS team_id,
    COALESCE(t.name, otm.provider_name, ots.team_code) AS name, otm.crest_url AS image
  FROM official_team_standings ots
  LEFT JOIN official_team_mappings otm ON otm.season_id = ots.season_id
    AND otm.provider = 'euroleague_advanced' AND otm.provider_team_code = ots.team_code
  LEFT JOIN teams t ON t.id = otm.team_id
  WHERE ots.season_id = $1 AND ots.position BETWEEN 1 AND $2
    AND ots.round_number = (SELECT MAX(round_number) FROM official_team_standings WHERE season_id = $1)
  ORDER BY ots.position`;

/** Seeds 1..seedCount of an explicit season from its final regular-season standings. */
export async function getPostseasonSeeds(
  seasonId: string,
  seedCount: number,
  connection: Connection = database
): Promise<PostseasonSeedRow[]> {
  const result = await connection.query<{
    seed: number;
    team_code: string;
    team_id: string | null;
    name: string;
    image: string | null;
  }>(SEEDS, [seasonId, seedCount]);
  return result.rows.map((row) => ({
    seed: row.seed,
    teamCode: row.team_code,
    teamId: row.team_id,
    name: row.name,
    image: row.image,
  }));
}

/** Postseason games of an explicit season with team ids; games involving unmapped teams are omitted. */
export async function getPostseasonGames(
  seasonId: string,
  connection: Connection = database
): Promise<PostseasonGameRow[]> {
  const result = await connection.query<{
    game_code: number;
    phase_code: string;
    home_team_id: string;
    away_team_id: string;
    scheduled_at: Date | null;
    is_played: boolean;
    home_score: number | null;
    away_score: number | null;
  }>(
    `SELECT g.game_code, g.phase_code, home.team_id::text AS home_team_id,
       away.team_id::text AS away_team_id, g.scheduled_at, g.is_played, g.home_score, g.away_score
     FROM official_schedule_games g
     JOIN official_team_mappings home ON home.season_id = g.season_id
       AND home.provider = 'euroleague_advanced' AND home.provider_team_code = g.home_team_code
     JOIN official_team_mappings away ON away.season_id = g.season_id
       AND away.provider = 'euroleague_advanced' AND away.provider_team_code = g.away_team_code
     WHERE g.season_id = $1 AND g.phase_code IN ('PI', 'PO', 'FF')
     ORDER BY g.scheduled_at NULLS LAST, g.game_code`,
    [seasonId]
  );
  return result.rows.map((row) => ({
    gameCode: row.game_code,
    phase: row.phase_code,
    homeTeamId: row.home_team_id,
    awayTeamId: row.away_team_id,
    scheduledAt: row.scheduled_at,
    isPlayed: row.is_played,
    homeScore: row.home_score,
    awayScore: row.away_score,
  }));
}

/** Facts deciding whether the playoffs window may open, read against the database clock. */
export async function getPostseasonReadiness(
  seasonId: string,
  connection: Connection = database
): Promise<PostseasonReadiness> {
  const result = await connection.query<{
    now: Date;
    rs_games: number;
    rs_unplayed: number;
    pi_games: number;
    pi_played: number;
    first_tip_off: Date | null;
  }>(
    `SELECT clock_timestamp() AS now,
       COUNT(*) FILTER (WHERE phase_code = 'RS')::int AS rs_games,
       COUNT(*) FILTER (WHERE phase_code = 'RS' AND NOT is_played)::int AS rs_unplayed,
       COUNT(*) FILTER (WHERE phase_code = 'PI')::int AS pi_games,
       COUNT(*) FILTER (WHERE phase_code = 'PI' AND is_played)::int AS pi_played,
       MIN(scheduled_at) FILTER (WHERE phase_code = 'PI') AS first_tip_off
     FROM official_schedule_games WHERE season_id = $1`,
    [seasonId]
  );
  const row = result.rows[0];
  return {
    now: row.now,
    regularSeasonGames: row.rs_games,
    regularSeasonUnplayed: row.rs_unplayed,
    playInGames: row.pi_games,
    playInPlayed: row.pi_played,
    firstPlayInTipOff: row.first_tip_off,
  };
}
