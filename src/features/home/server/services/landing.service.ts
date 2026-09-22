import 'server-only';

import { getLandingStandings } from '@/features/standings/server';
import { getRoundCalendar } from '@/features/rounds/server';
import { CONFIG } from '@/lib/config';
import type { HomeLandingStats } from '../../models/landing';

export function createLandingService(deps: {
  standings: typeof getLandingStandings;
  rounds: typeof getRoundCalendar;
  seasonName: () => string;
}) {
  return async function fetchLandingStats(): Promise<HomeLandingStats> {
    // Preserve the original sequential reads and current-only (not next-round) selection.
    const standings = await deps.standings();
    const userCount = standings?.length || 0;
    const { currentRound } = await deps.rounds();
    let roundNumber = 0;
    if (currentRound?.roundName) {
      const match = currentRound.roundName.match(/\d+/);
      if (match) roundNumber = parseInt(match[0], 10);
    }
    const playoffStartRound = 39;
    const weeksToPlayoffs = roundNumber > 0 ? Math.max(0, playoffStartRound - roundNumber) : 0;
    return {
      seasonName: deps.seasonName(),
      userCount,
      currentRound: currentRound?.roundName || 'Pre-Season',
      weeksToPlayoffs,
      playoffStartRound,
    };
  };
}

export const fetchLandingStats = createLandingService({
  standings: getLandingStandings,
  rounds: getRoundCalendar,
  seasonName: () => CONFIG.SEASON.NAME,
});
