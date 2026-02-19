import { db } from '../../client';

export interface Team {
  id: number;
  name: string;
  short_name: string;
  logo: string;
}

/**
 * Get team details by ID
 */
export async function getTeamById(id: number | string): Promise<Team | undefined> {
  const query = `
    SELECT 
      id,
      name,
      short_name,
      img as logo
    FROM teams
    WHERE id = $1
  `;
  return (await db.query(query, [id])).rows[0];
}
