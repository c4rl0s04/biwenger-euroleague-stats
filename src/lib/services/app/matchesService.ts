import 'server-only';

/**
 * Matches Service
 * Business logic for match display and grouping
 */

import { getMatchesGroupedByRound as getRawMatches } from '../../db';
import { getCurrentRoundState } from '../core/roundsService';

/**
 * Get matches grouped by round with current round logic
 * @returns { rounds, currentRoundId }
 */
export async function fetchMatchesGrouped() {
  // 1. Get raw grouped matches
  const roundsArr = await getRawMatches();

  // 2. Get current round state to determine what to show
  const { currentRound, nextRound } = await getCurrentRoundState();

  let currentRoundId;

  if (currentRound && currentRound.status_calc === 'live') {
    // A round is currently being played - show it
    currentRoundId = currentRound.round_id;
  } else if (nextRound) {
    // No live round - show the next upcoming round
    currentRoundId = nextRound.round_id;
  } else if (currentRound) {
    // Season finished - show the last round
    currentRoundId = currentRound.round_id;
  } else {
    // Fallback to first round
    currentRoundId = roundsArr[0]?.round_id;
  }

  return {
    rounds: roundsArr,
    currentRoundId,
  };
}
