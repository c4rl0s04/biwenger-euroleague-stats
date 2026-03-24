import 'server-only';

/**
 * Schedule Service
 * Business logic for the User Schedule page.
 */

import { getCurrentRoundState } from '../core/roundsService';
import {
  getRoundById,
  getLastRound,
  fetchMatchesForRound,
  fetchUserPlayers,
  getScheduleRounds,
  resolveRoundIdByPolicy,
} from '../../db';
import { getTeamColor } from '../../constants/teamColors.js';

export async function fetchScheduleRounds() {
  return await getScheduleRounds();
}

export async function getUserScheduleService(
  userId: string | number,
  targetRoundId: string | number | null = null
) {
  try {
    let targetRound;

    // 1. Determine which round to show (Standardized priority: Live > Upcoming > Finished)
    const activeRoundId = targetRoundId || (await resolveRoundIdByPolicy('active_or_next'));
    if (activeRoundId && !targetRound) {
      targetRound = await getRoundById(Number(activeRoundId));
    }

    // Still no round? Try last one
    if (!targetRound) {
      targetRound = await getLastRound();
    }

    if (!targetRound) {
      return { found: false, message: 'No upcoming rounds found.' };
    }

    const [matches, userPlayers] = await Promise.all([
      fetchMatchesForRound(Number(targetRound.round_id)),
      fetchUserPlayers(Number(userId)),
    ]);

    if (userPlayers.length === 0) {
      return {
        found: true,
        round: targetRound,
        matches: [],
        message: 'User has no players.',
      };
    }

    // 3. Logic: Map matches to include user players
    // This is pure JS logic moving out of the DB layer
    const schedule = matches.map((match: any) => {
      // Find players playing in this match (either home or away)
      const matchPlayers = userPlayers
        .filter((p: any) => p.team_id === match.home_id || p.team_id === match.away_id)
        .map((p: any) => ({
          ...p,
          is_home: p.team_id === match.home_id,
          opponent: p.team_id === match.home_id ? match.away_team : match.home_team,
          // Calculate team color
          team_color: getTeamColor(p.team_code),
        }))
        // Sort by fantasy points (descending)
        .sort((a: any, b: any) => (b.puntos || 0) - (a.puntos || 0));

      return {
        ...match,
        home_team_color: getTeamColor(match.home_code),
        away_team_color: getTeamColor(match.away_code),
        user_players: matchPlayers,
        has_players: matchPlayers.length > 0,
      };
    });

    return {
      found: true,
      round: targetRound,
      matches: schedule,
      total_players: schedule.reduce((acc: number, m: any) => acc + m.user_players.length, 0),
      // Return all user players so the frontend can summarize TOTAL squad points
      userPlayers: userPlayers.sort((a: any, b: any) => (b.puntos || 0) - (a.puntos || 0)),
    };
  } catch (error: any) {
    console.error('Error in getUserScheduleService:', error);
    return { found: false, message: error.message };
  }
}
