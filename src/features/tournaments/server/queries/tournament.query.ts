import 'server-only';
import { pgClient } from '@/lib/db/connection';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import type {
  TournamentRecord,
  TournamentStandingRecord,
  TournamentFixtureRecord,
  ManagerTournamentRecord,
} from './tournament.records';

export async function readTournaments(): Promise<TournamentRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const { rows } = await pgClient.query(
    `
    SELECT
      t.id,
      t.name,
      t.type,
      t.status,
      t.data_json
    FROM tournaments t
    WHERE t.season_id = $1
    ORDER BY
      CASE WHEN t.status = 'active' THEN 1 ELSE 2 END,
      t.updated_at DESC
  `,
    [seasonId]
  );

  return rows;
}

export async function readTournamentById(id: number): Promise<TournamentRecord | null> {
  const seasonId = await resolveReadSeasonId();
  const { rows } = await pgClient.query(
    `
    SELECT
      t.id,
      t.name,
      t.type,
      t.status,
      t.data_json
    FROM tournaments t
    WHERE t.season_id = $2 AND t.id = $1
  `,
    [id, seasonId]
  );

  if (rows.length === 0) return null;

  return rows[0];
}

export async function readTournamentStandings(
  tournamentId: number | null
): Promise<TournamentStandingRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const { rows } = await pgClient.query(
    `
        SELECT
            ts.*,
            COALESCE(us.name, u.name) as user_name,
            COALESCE(us.icon, u.icon) as user_icon,
            COALESCE(us.color_index, u.color_index, 0) as user_color
        FROM tournament_standings ts
        JOIN tournaments t ON t.id = ts.tournament_id AND t.season_id = ts.season_id
        LEFT JOIN users u ON ts.user_id = u.id
        LEFT JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ts.season_id
        WHERE ts.season_id = $2 AND ($1::int IS NULL OR ts.tournament_id = $1)
        ORDER BY ts.position ASC
    `,
    [tournamentId, seasonId]
  );

  return rows;
}

export async function readTournamentFixtures(
  tournamentId: number | null
): Promise<TournamentFixtureRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const { rows } = await pgClient.query(
    `
    SELECT
      tf.id,
      tf.tournament_id,
      tf.phase_id,
      tf.round_name,
      tf.round_id,
      tf.group_name,
      tf.home_user_id,
      tf.away_user_id,
      tf.home_score,
      tf.away_score,
      tf.date,
      tf.status,
      tp.name as phase_name,
      tp.type as phase_type,
      COALESCE(ush.name, uh.name) as home_user_name,
      COALESCE(ush.icon, uh.icon) as home_user_icon,
      COALESCE(ush.color_index, uh.color_index, 0) as home_user_color,
      COALESCE(usa.name, ua.name) as away_user_name,
      COALESCE(usa.icon, ua.icon) as away_user_icon,
      COALESCE(usa.color_index, ua.color_index, 0) as away_user_color
    FROM tournament_fixtures tf
    JOIN tournaments t ON t.id = tf.tournament_id AND t.season_id = tf.season_id
    LEFT JOIN tournament_phases tp ON tf.phase_id = tp.id AND tp.season_id = tf.season_id
    LEFT JOIN users uh ON tf.home_user_id = uh.id
    LEFT JOIN users ua ON tf.away_user_id = ua.id
    LEFT JOIN user_seasons ush ON ush.user_id = uh.id AND ush.season_id = tf.season_id
    LEFT JOIN user_seasons usa ON usa.user_id = ua.id AND usa.season_id = tf.season_id
    WHERE tf.season_id = $2 AND ($1::int IS NULL OR tf.tournament_id = $1)
    ORDER BY tf.date ASC
    `,
    [tournamentId, seasonId]
  );

  return rows;
}

export async function readManagerTournaments(
  userId: string | number
): Promise<ManagerTournamentRecord[]> {
  const seasonId = await resolveReadSeasonId();
  const { rows } = await pgClient.query(
    `
    WITH user_leagues AS (
      SELECT
        t.id as tournament_id,
        t.name as tournament_name,
        t.type as tournament_type,
        t.status as tournament_status,
        t.data_json,
        ts.position,
        ts.points,
        ts.won,
        ts.drawn,
        ts.lost,
        ts.phase_name,
        ts.group_name
      FROM tournament_standings ts
      JOIN tournaments t ON ts.tournament_id = t.id AND t.season_id = ts.season_id
      WHERE ts.season_id = $2 AND ts.user_id = $1::text
    ),
    user_playoffs AS (
      SELECT
        t.id as tournament_id,
        t.name as tournament_name,
        t.type as tournament_type,
        t.status as tournament_status,
        t.data_json,
        NULL::int as position,
        NULL::int as points,
        0 as won,
        0 as drawn,
        0 as lost,
        NULL::text as phase_name,
        NULL::text as group_name
      FROM tournaments t
      WHERE t.season_id = $2
        AND t.type = 'playoff'
        AND t.data_json::text LIKE '%' || $1::text || '%'
    )
    SELECT * FROM user_leagues
    UNION ALL
    SELECT * FROM user_playoffs
    ORDER BY tournament_id DESC
    `,
    [String(userId), seasonId]
  );

  return rows;
}
