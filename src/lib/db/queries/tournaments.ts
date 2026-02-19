import { db } from '../client';

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
  const { rows } = await db.query(`
    SELECT 
      t.id, 
      t.name, 
      t.type, 
      t.status, 
      t.data_json
    FROM tournaments t
    ORDER BY 
      CASE WHEN t.status = 'active' THEN 1 ELSE 2 END,
      t.updated_at DESC
  `);

  return rows.map((t: any) => ({
    ...t,
    data: t.data_json ? JSON.parse(t.data_json) : null,
  }));
}

export async function getTournamentById(id: number): Promise<Tournament | null> {
  const { rows } = await db.query(
    `
    SELECT 
      t.id, 
      t.name, 
      t.type, 
      t.status, 
      t.data_json
    FROM tournaments t
    WHERE t.id = $1
  `,
    [id]
  );

  if (rows.length === 0) return null;

  const t = rows[0];

  return {
    ...t,
    data: t.data_json ? JSON.parse(t.data_json) : null,
  };
}

export async function getTournamentStandings(tournamentId: number | null): Promise<TournamentStanding[]> {
  const { rows } = await db.query(
    `
        SELECT 
            ts.*,
            u.name as user_name,
            u.icon as user_icon,
            u.color_index as user_color
        FROM tournament_standings ts
        LEFT JOIN users u ON ts.user_id = u.id
        WHERE ($1::int IS NULL OR ts.tournament_id = $1)
        ORDER BY ts.position ASC
    `,
    [tournamentId]
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
      user_color: row.user_color ? parseInt(row.user_color) : null
  }));
}

export async function getTournamentFixtures(tournamentId: number | null): Promise<TournamentFixture[]> {
  const { rows } = await db.query(
    `
        SELECT 
            tf.*,
            uh.name as home_user_name,
            uh.icon as home_user_icon,
            uh.color_index as home_user_color,
            ua.name as away_user_name,
            ua.icon as away_user_icon,
            ua.color_index as away_user_color
        FROM tournament_fixtures tf
        LEFT JOIN users uh ON tf.home_user_id = uh.id
        LEFT JOIN users ua ON tf.away_user_id = ua.id
        WHERE ($1::int IS NULL OR tf.tournament_id = $1)
        ORDER BY tf.date DESC
    `,
    [tournamentId]
  );
  
  return rows.map((row: any) => ({
      ...row,
      home_score: row.home_score,
      away_score: row.away_score,
      // Ensure color index is number
      home_user_color: row.home_user_color ? parseInt(row.home_user_color) : null,
      away_user_color: row.away_user_color ? parseInt(row.away_user_color) : null
  }));
}
