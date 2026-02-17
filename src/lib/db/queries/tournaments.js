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

export async function getTournamentStandings(tournamentId) {
  const { rows } = await db.query(
    `
        SELECT * FROM tournament_standings 
        WHERE tournament_id = $1
        ORDER BY position ASC
    `,
    [tournamentId]
  );
  return rows;
}

export async function getTournamentFixtures(tournamentId) {
  const { rows } = await db.query(
    `
        SELECT * FROM tournament_fixtures
        WHERE tournament_id = $1
        ORDER BY date DESC
    `,
    [tournamentId]
  );
  return rows;
}
