import { db } from '../../client.js';
import { NEXT_ROUND_CTE } from '../../sql_utils.js';

export async function getScheduleRounds() {
  try {
    const query = `
      SELECT round_id, round_name 
      FROM matches 
      GROUP BY round_id, round_name
      ORDER BY MIN(date) ASC
    `;
    const rows = (await db.query(query)).rows;

    // Deduplicate rounds
    // If "Jornada 14" and "Jornada 14 (aplazada)" exist, keep only one.
    // Preference: The one with "(aplazada)" (usually latest info)
    const roundMap = new Map();

    for (const r of rows) {
      // Normalize name: "Jornada 14 (aplazada)" -> "Jornada 14"
      const baseName = r.round_name.replace(/\s*\(.*\)/, '').trim();

      if (!roundMap.has(baseName)) {
        roundMap.set(baseName, { ...r, round_name: baseName });
      } else {
        // If we found a duplicate (e.g. we have "Jornada 14", now found "Jornada 14 (aplazada)")
        // logic: if current row has 'aplazada', overwrite.
        if (r.round_name.toLowerCase().includes('aplazada')) {
          roundMap.set(baseName, { ...r, round_name: baseName });
        }
      }
    }

    return Array.from(roundMap.values());
  } catch (error) {
    console.error('Error in getScheduleRounds:', error);
    return [];
  }
}

// Helper DAO: Get round by ID
export async function getRoundById(roundId) {
  const query = 'SELECT DISTINCT round_id, round_name FROM matches WHERE round_id = $1';
  return (await db.query(query, [roundId])).rows[0];
}

// Helper DAO: Get last round
export async function getLastRound() {
  const query = 'SELECT round_id, round_name FROM matches ORDER BY date DESC LIMIT 1';
  return (await db.query(query)).rows[0];
}

// Helper DAO: Get matches for a round
export async function fetchMatchesForRound(roundId) {
  const query = `
    SELECT 
      m.id as match_id,
      m.date,
      m.home_id,
      m.away_id,
      th.short_name as home_team,
      ta.short_name as away_team,
      th.code as home_code,
      ta.code as away_code
    FROM matches m
    LEFT JOIN teams th ON m.home_id = th.id
    LEFT JOIN teams ta ON m.away_id = ta.id
    WHERE m.round_id = $1
    ORDER BY m.date ASC
  `;
  return (await db.query(query, [roundId])).rows;
}

// Helper DAO: Get user's players
export async function fetchUserPlayers(userId) {
  const query = `
    SELECT 
      p.id,
      p.name,
      p.team_id,
      t.short_name as team_name,
      t.code as team_code,
      p.position,
      p.price,
      p.img,
      p.puntos
    FROM players p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.owner_id = $1
  `;
  return (await db.query(query, [userId])).rows;
}
