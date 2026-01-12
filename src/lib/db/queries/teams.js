import { db } from '../client.js';

/**
 * Get team details by ID
 * @param {number} id - Team ID
 * @returns {Promise<Object>} Team details
 */
export async function getTeamById(id) {
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
