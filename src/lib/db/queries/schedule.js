import { db } from '../client.js';
import { NEXT_ROUND_CTE } from '../sql_utils.js';

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

export async function getUserSchedule(userId, targetRoundId = null) {
  try {
    let targetRound;

    // 1. Determine which round to show
    if (targetRoundId) {
      const targetQuery = 'SELECT DISTINCT round_id, round_name FROM matches WHERE round_id = $1';
      targetRound = (await db.query(targetQuery, [targetRoundId])).rows[0];
    }

    // Fallback: Find the ID of the next upcoming round
    if (!targetRound) {
      const nextRoundQuery = `
        ${NEXT_ROUND_CTE}
        SELECT m.round_id, m.round_name 
        FROM matches m
        JOIN NextRoundStart nr ON m.round_id = nr.round_id
        GROUP BY m.round_id, m.round_name
      `;
      targetRound = (await db.query(nextRoundQuery)).rows[0];
    }

    // If still no round (e.g., season over), maybe get the last played round?
    // For now, if no future matches and no ID provided, try getting the LAST round
    if (!targetRound) {
      const lastRoundQuery = 'SELECT round_id, round_name FROM matches ORDER BY date DESC LIMIT 1';
      targetRound = (await db.query(lastRoundQuery)).rows[0];
    }

    if (!targetRound) {
      return { found: false, message: 'No upcoming rounds found.' };
    }

    // 2. Get all matches for this round, ordered by date
    const matchesQuery = `
      SELECT 
        m.id as match_id,
        m.date,
        m.home_id,
        m.away_id,
        th.short_name as home_team,
        ta.short_name as away_team
      FROM matches m
      LEFT JOIN teams th ON m.home_id = th.id
      LEFT JOIN teams ta ON m.away_id = ta.id
      WHERE m.round_id = $1
      ORDER BY m.date ASC
    `;
    const matches = (await db.query(matchesQuery, [targetRound.round_id])).rows;

    // 3. Get the user's players
    const userPlayersQuery = `
      SELECT 
        p.id,
        p.name,
        p.team_id,
        t.short_name as team_name,
        p.position,
        p.price,
        p.img
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.owner_id = $1
    `;
    const userPlayers = (await db.query(userPlayersQuery, [userId])).rows;

    if (userPlayers.length === 0) {
      return {
        found: true,
        round: targetRound,
        matches: [],
        message: 'User has no players.',
      };
    }

    // 4. Map matches to include user players
    const schedule = matches.map((match) => {
      // Find players playing in this match (either home or away)
      const matchPlayers = userPlayers
        .filter((p) => p.team_id === match.home_id || p.team_id === match.away_id)
        .map((p) => ({
          ...p,
          is_home: p.team_id === match.home_id,
          opponent: p.team_id === match.home_id ? match.away_team : match.home_team,
        }));

      return {
        ...match,
        user_players: matchPlayers,
        has_players: matchPlayers.length > 0,
      };
    });

    return {
      found: true,
      round: targetRound,
      matches: schedule,
      total_players: schedule.reduce((acc, m) => acc + m.user_players.length, 0),
    };
  } catch (error) {
    console.error('Error in getUserSchedule:', error);
    return { found: false, message: error.message };
  }
}
