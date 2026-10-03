import 'server-only';

import type { Pool, PoolClient } from 'pg';
import { pool } from '@/lib/db/client';
import { POSITIONS } from '@/lib/constants/thresholds';
import type { PredictionChoice, SeasonPredictionOptions } from '../../models/options';

const database = pool as Pool;

function alphabetize(choices: PredictionChoice[]) {
  return choices.sort(
    (left, right) => left.name.localeCompare(right.name, 'es') || left.id.localeCompare(right.id)
  );
}

/** Every directory is scoped by an explicit season ID. Used only when opening a window. */
export async function getSeasonPredictionCandidates(
  seasonId: string,
  connection: Pool | PoolClient = database
): Promise<SeasonPredictionOptions> {
  const players = await connection.query<{
    id: number;
    name: string | null;
    image: string | null;
    team: string | null;
    position: string | null;
  }>(
    `SELECT p.id, p.name, p.img AS image, COALESCE(ts.name, t.name) AS team, ps.position
       FROM player_seasons ps JOIN players p ON p.id = ps.player_id
       LEFT JOIN team_seasons ts ON ts.season_id = ps.season_id AND ts.team_id = ps.team_id
       LEFT JOIN teams t ON t.id = ps.team_id WHERE ps.season_id = $1`,
    [seasonId]
  );
  const teams = await connection.query<{ id: number; name: string | null; image: string | null }>(
    `SELECT t.id, COALESCE(ts.name, t.name) AS name,
            COALESCE(NULLIF(otm.crest_url, ''), NULLIF(t.img, ''), NULLIF(ts.img, '')) AS image
       FROM team_seasons ts JOIN teams t ON t.id = ts.team_id
       LEFT JOIN official_team_mappings otm ON otm.season_id = ts.season_id
         AND otm.team_id = t.id AND otm.provider = 'euroleague_advanced'
       WHERE ts.season_id = $1`,
    [seasonId]
  );
  const managers = await connection.query<{ id: string; name: string; image: string | null }>(
    `SELECT user_id AS id, name, icon AS image FROM user_seasons
       WHERE season_id = $1 AND status = 'active'`,
    [seasonId]
  );
  return {
    players: alphabetize(
      players.rows.map((row) => {
        const positionCode = Number(row.position);
        const position = POSITIONS[positionCode as keyof typeof POSITIONS] ?? row.position;
        return {
          id: String(row.id),
          name: row.name || `Jugador ${row.id}`,
          detail: [row.team, position].filter(Boolean).join(' · '),
          image: row.image,
        };
      })
    ),
    teams: alphabetize(
      teams.rows.map((row) => ({
        id: String(row.id),
        name: row.name || `Equipo ${row.id}`,
        image: row.image,
      }))
    ),
    managers: alphabetize(
      managers.rows.map((row) => ({
        id: row.id,
        name: row.name || `Mánager ${row.id}`,
        image: row.image,
      }))
    ),
  };
}

/** Corrects display URLs in existing frozen windows without changing eligible IDs or saved answers. */
export async function getSeasonPredictionTeamCrests(
  seasonId: string,
  teamIds: readonly string[],
  connection: Pool | PoolClient = database
): Promise<Map<string, string>> {
  if (!teamIds.length) return new Map();
  const result = await connection.query<{ id: string; image: string }>(
    `SELECT team_id::text AS id, crest_url AS image FROM official_team_mappings
       WHERE season_id = $1 AND provider = 'euroleague_advanced'
         AND team_id = ANY($2::integer[]) AND NULLIF(crest_url, '') IS NOT NULL`,
    [seasonId, teamIds.map(Number)]
  );
  return new Map(result.rows.map((row) => [row.id, row.image]));
}
