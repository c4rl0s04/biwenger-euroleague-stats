import {
  getInitialSquadActualPerformance,
  getBestInitialSquadPlayer,
  getInitialSquadRetainedPoints,
  getInitialSquadRetainedBreakdown,
  getInitialSquadRegret,
  getInitialSquadLoyalty,
  getInitialSquadPotentialAdvanced,
  getInitialSquadsDetailed,
} from '@/lib/db';

export async function queryInitialSquadAnalytics() {
  return getInitialSquadActualPerformance();
}

export async function queryInitialSquadStatsBundle() {
  const [
    bestDraftPerUser,
    retainedRanking,
    retainedBreakdown,
    regretRanking,
    loyaltyRanking,
    potentialRanking,
    detailedSquads,
  ] = await Promise.all([
    getBestInitialSquadPlayer(),
    getInitialSquadRetainedPoints(),
    getInitialSquadRetainedBreakdown(),
    getInitialSquadRegret(),
    getInitialSquadLoyalty(),
    getInitialSquadPotentialAdvanced(),
    getInitialSquadsDetailed(),
  ]);
  return {
    bestDraftPerUser,
    retainedRanking,
    retainedBreakdown,
    regretRanking,
    loyaltyRanking,
    potentialRanking,
    detailedSquads: detailedSquads || [],
  };
}
