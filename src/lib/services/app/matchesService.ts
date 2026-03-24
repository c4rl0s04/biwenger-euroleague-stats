import 'server-only';

/**
 * Matches Service
 * Business logic for match display and grouping
 */

import { getMatchesGroupedByRound as getRawMatches, getNextRound } from '../../db';
import { getCurrentRoundState } from '../core/roundsService';

/**
 * Get matches grouped by round with current round logic
 * @returns { rounds, currentRoundId }
 */
export async function fetchMatchesGrouped() {
  // 1. Get raw grouped matches
  const roundsArr = await getRawMatches();

  const currentRoundId = await getNextRound();

  return {
    rounds: roundsArr,
    currentRoundId,
  };
}
