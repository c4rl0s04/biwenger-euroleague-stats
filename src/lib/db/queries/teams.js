import { db } from '../client.js';

/**
 * Get team details by ID
 * @param {number} id - Team ID
 * @returns {Object} Team details
 */
export function getTeamById(id) {
  const query = `
    SELECT 
      id,
      name,
      short_name,
      img as logo
    FROM teams
    WHERE id = ?
  `;
  return db.prepare(query).get(id);
}
