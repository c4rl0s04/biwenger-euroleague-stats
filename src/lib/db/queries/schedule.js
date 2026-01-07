import { db } from '@/lib/db/client';

export function getScheduleRounds() {
  try {
    return db
      .prepare(
        `
      SELECT DISTINCT round_id, round_name 
      FROM matches 
      ORDER BY date ASC
    `
      )
      .all();
  } catch (error) {
    console.error('Error in getScheduleRounds:', error);
    return [];
  }
}

export function getUserSchedule(userId, targetRoundId = null) {
  try {
    let targetRound;

    // 1. Determine which round to show
    if (targetRoundId) {
      targetRound = db
        .prepare('SELECT DISTINCT round_id, round_name FROM matches WHERE round_id = ?')
        .get(targetRoundId);
    }

    // Fallback: Find the ID of the next upcoming round
    if (!targetRound) {
      targetRound = db
        .prepare(
          `
        SELECT round_id, round_name 
        FROM matches 
        WHERE datetime(date) > datetime('now') 
        ORDER BY date ASC 
        LIMIT 1
      `
        )
        .get();
    }

    // If still no round (e.g., season over), maybe get the last played round?
    // For now, if no future matches and no ID provided, try getting the LAST round
    if (!targetRound) {
      targetRound = db
        .prepare('SELECT round_id, round_name FROM matches ORDER BY date DESC LIMIT 1')
        .get();
    }

    if (!targetRound) {
      return { found: false, message: 'No upcoming rounds found.' };
    }

    // 2. Get all matches for this round, ordered by date
    const matches = db
      .prepare(
        `
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
      WHERE m.round_id = ?
      ORDER BY m.date ASC
    `
      )
      .all(targetRound.round_id);

    // 3. Get the user's players
    const userPlayers = db
      .prepare(
        `
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
      WHERE p.owner_id = ?
    `
      )
      .all(userId);

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
