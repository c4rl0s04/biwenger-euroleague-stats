import { db } from '../client.js';

export async function getTournaments() {
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

  return rows.map((t) => ({
    ...t,
    data: t.data_json ? JSON.parse(t.data_json) : null,
  }));
}

export async function getTournamentById(id) {
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

export async function getTournamentStandings(tournamentId) {
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
  return rows;
}

export async function getTournamentFixtures(tournamentId) {
  const { rows } = await db.query(
    `
        SELECT 
            tf.*,
            uh.name as home_user_name,
            uh.icon as home_user_icon,
            ua.name as away_user_name,
            ua.icon as away_user_icon
        FROM tournament_fixtures tf
        LEFT JOIN users uh ON tf.home_user_id = uh.id
        LEFT JOIN users ua ON tf.away_user_id = ua.id
        WHERE ($1::int IS NULL OR tf.tournament_id = $1)
        ORDER BY tf.date DESC
    `,
    [tournamentId]
  );
  return rows;
}
