import 'server-only';
// Landing statistics retained until its remaining consumers migrate.
import { getSimpleStandings as getStandings, getCurrentRoundState } from '../../db';
import { CONFIG } from '../../config';

export async function fetchLandingStats() {
  const standings = await getStandings();
  const userCount = standings?.length || 0;

  const { currentRound } = await getCurrentRoundState();
  let roundNumber = 0;

  if (currentRound && currentRound.round_name) {
    const match = currentRound.round_name.match(/\d+/);
    if (match) {
      roundNumber = parseInt(match[0], 10);
    }
  }

  const PLAYOFF_START_ROUND = 39;
  let weeksToPlayoffs = 0;
  if (roundNumber > 0) {
    weeksToPlayoffs = Math.max(0, PLAYOFF_START_ROUND - roundNumber);
  }

  return {
    seasonName: CONFIG.SEASON.NAME,
    userCount,
    currentRound: currentRound?.round_name || 'Pre-Season',
    weeksToPlayoffs,
    playoffStartRound: PLAYOFF_START_ROUND,
  };
}
