import { db, pgClient } from '../index';
import { resolveReadSeasonId } from '../season-context';

// ==========================================
// INTERFACES
// ==========================================

export interface Tournament {
  id: number;
  name: string;
  type: string;
  status: string;
  data_json: string | null;
  data: any | null; // Parsed JSON structure varies by type
}

export interface TournamentStanding {
  // From tournament_standings table
  id: number;
  tournament_id: number;
  phase_name: string | null;
  group_name: string | null;
  user_id: string | null; // text in schema
  position: number | null;
  points: number | null;
  won: number | null;
  lost: number | null;
  drawn: number | null;
  scored: number | null;
  against: number | null;

  // Joined fields from users table
  user_name: string | null;
  user_icon: string | null;
  user_color: number | null;
}

export interface TournamentFixture {
  // From tournament_fixtures table
  id: number;
  tournament_id: number;
  phase_id: number | null;
  round_name: string | null;
  round_id: number | null;
  group_name: string | null;
  home_user_id: string | null; // text in schema
  away_user_id: string | null; // text in schema
  home_score: number | null;
  away_score: number | null;
  date: number | null; // integer timestamp in schema
  status: string | null;

  // Joined fields from users table
  home_user_name: string | null;
  home_user_icon: string | null;
  home_user_color: number | null;
  away_user_name: string | null;
  away_user_icon: string | null;
  away_user_color: number | null;
}

// ==========================================
// QUERIES
// ==========================================

export async function getTournaments(): Promise<Tournament[]> {
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

  return rows.map((t: any) => ({
    ...t,
    data: t.data_json ? JSON.parse(t.data_json) : null,
  }));
}

export async function getTournamentById(id: number): Promise<Tournament | null> {
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

  const t = rows[0];

  return {
    ...t,
    data: t.data_json ? JSON.parse(t.data_json) : null,
  };
}

export async function getTournamentStandings(
  tournamentId: number | null
): Promise<TournamentStanding[]> {
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

  return rows.map((row: any) => ({
    ...row,
    // Ensure numeric fields are typed correctly if DB returns strings (pg driver usually handles integers fine)
    position: row.position,
    points: row.points,
    won: row.won,
    lost: row.lost,
    drawn: row.drawn,
    scored: row.scored,
    against: row.against,
    user_color:
      row.user_color !== null && row.user_color !== undefined ? parseInt(row.user_color) : null,
  }));
}

export async function getTournamentFixtures(
  tournamentId: number | null
): Promise<TournamentFixture[]> {
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

  return rows.map((row: any) => ({
    ...row,
    home_score: row.home_score,
    away_score: row.away_score,
    // Ensure color index is number
    home_user_color:
      row.home_user_color !== null && row.home_user_color !== undefined
        ? parseInt(row.home_user_color)
        : null,
    away_user_color:
      row.away_user_color !== null && row.away_user_color !== undefined
        ? parseInt(row.away_user_color)
        : null,
  }));
}

export async function getUserTournaments(userId: string | number) {
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

  return rows.map((row: any) => ({
    ...row,
    position: row.position ? parseInt(row.position) : null,
    points: row.points ? parseInt(row.points) : null,
    won: row.won ? parseInt(row.won) : 0,
    drawn: row.drawn ? parseInt(row.drawn) : 0,
    lost: row.lost ? parseInt(row.lost) : 0,
  }));
}
