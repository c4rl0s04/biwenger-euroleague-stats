import 'server-only';
import { cache } from 'react';
import {
  mapDraftPerformance,
  mapDraftPlayer,
  mapDraftRetainedPoints,
  mapDraftPlayerBreakdown,
  mapDraftRegret,
  mapDraftLoyalty,
  mapDraftPotential,
  mapDraftDetailed,
} from '../mappers/draft.mapper';
import {
  getInitialSquadActualPerformance,
  getBestInitialSquadPlayer,
  getInitialSquadRetainedPoints,
  getInitialSquadRetainedBreakdown,
  getInitialSquadRegret,
  getInitialSquadLoyalty,
  getInitialSquadPotentialAdvanced,
  getInitialSquadsDetailed,
} from '../queries/draft.query';

/**
 * Access: Public league statistics.
 * Freshness: Cached HTTP max-age=900, stale-while-revalidate=60
 */
export const fetchInitialSquadAnalytics = cache(async () => {
  const data = await getInitialSquadActualPerformance();
  return {
    performance: data.map(mapDraftPerformance),
  };
});

/**
 * Access: Public league statistics.
 * Freshness: Cached HTTP max-age=300, stale-while-revalidate=60
 */
export const fetchInitialSquadStats = cache(async () => {
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
    bestDraftPerUser: bestDraftPerUser.map(mapDraftPlayer),
    retainedRanking: retainedRanking.map(mapDraftRetainedPoints),
    retainedBreakdown: retainedBreakdown.map(mapDraftPlayerBreakdown),
    regretRanking: regretRanking.map(mapDraftRegret),
    loyaltyRanking: loyaltyRanking.map(mapDraftLoyalty),
    potentialRanking: potentialRanking.map(mapDraftPotential),
    detailedSquads: detailedSquads.map(mapDraftDetailed),
  };
});
