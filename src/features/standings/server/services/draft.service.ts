import 'server-only';
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
import type { DraftStatsBundleViewModel } from '../../models/draft';

/**
 * Access: Public league statistics.
 * Freshness: Private HTTP response with no-store
 */
export const fetchInitialSquadAnalytics = async () => {
  const data = await getInitialSquadActualPerformance();
  return data.map(mapDraftPerformance);
};

/**
 * Access: Public league statistics.
 * Freshness: Private HTTP response with no-store
 */
export const fetchInitialSquadStats = async (): Promise<DraftStatsBundleViewModel> => {
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
    detailedSquads: (detailedSquads || []).map(mapDraftDetailed),
  };
};
