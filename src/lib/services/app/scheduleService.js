/**
 * Schedule Service
 * Business logic for the User Schedule page.
 */

import { getCurrentRoundState } from '../core/roundsService.js';
import {
  getRoundById,
  getLastRound,
  fetchMatchesForRound,
  fetchUserPlayers,
  getScheduleRounds,
} from '../../db';
import { getTeamColor } from '../../constants/teamColors.js';

export async function fetchScheduleRounds() {
  return await getScheduleRounds();
}

export async function getUserScheduleService(userId, targetRoundId = null) {
  try {
    let targetRound;

    // 1. Determine which round to show
    if (targetRoundId) {
      targetRound = await getRoundById(targetRoundId);
    }

    // Fallback: Custom Logic for Schedule Page
    if (!targetRound) {
      const { currentRound, nextRound } = await getCurrentRoundState();

      if (currentRound && currentRound.status_calc === 'live') {
        targetRound = { round_id: currentRound.round_id, round_name: currentRound.round_name };
      } else if (nextRound) {
        targetRound = { round_id: nextRound.round_id, round_name: nextRound.round_name };
      } else if (currentRound) {
        targetRound = { round_id: currentRound.round_id, round_name: currentRound.round_name };
      }
    }

    // Still no round? Try last one
    if (!targetRound) {
      targetRound = await getLastRound();
    }

    if (!targetRound) {
      return { found: false, message: 'No upcoming rounds found.' };
    }

    // 2. Fetch Data in Parallel (Optimization)
    const [matches, userPlayers] = await Promise.all([
      fetchMatchesForRound(targetRound.round_id),
      fetchUserPlayers(userId),
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
    const schedule = matches.map((match) => {
      // Find players playing in this match (either home or away)
      const matchPlayers = userPlayers
        .filter((p) => p.team_id === match.home_id || p.team_id === match.away_id)
        .map((p) => ({
          ...p,
          is_home: p.team_id === match.home_id,
          opponent: p.team_id === match.home_id ? match.away_team : match.home_team,
          // Calculate team color
          team_color: getTeamColor(p.team_code),
        }))
        // Sort by fantasy points (descending)
        .sort((a, b) => (b.puntos || 0) - (a.puntos || 0));

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
      total_players: schedule.reduce((acc, m) => acc + m.user_players.length, 0),
      // Return all user players so the frontend can summarize TOTAL squad points
      userPlayers: userPlayers.sort((a, b) => (b.puntos || 0) - (a.puntos || 0)),
    };
  } catch (error) {
    console.error('Error in getUserScheduleService:', error);
    return { found: false, message: error.message };
  }
}
