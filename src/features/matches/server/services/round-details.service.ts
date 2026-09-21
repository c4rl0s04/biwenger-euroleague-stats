import 'server-only';
import { getTeamPositions, type StandingsMatch } from '@/lib/logic/standings';
import {
  queryRoundInfo,
  queryFinishedMatches,
  queryRoundFixtures,
  resolveFixtureSeason,
} from '../queries/round-details.query';
import { mapRoundDetails } from '../mappers/round-details.mapper';

export const ROUND_DETAILS_POLICY = {
  access: 'public-fixtures',
  serverCache: 'none',
  httpSeconds: 60,
} as const;
export function createRoundDetailsService(deps: {
  season: typeof resolveFixtureSeason;
  info: typeof queryRoundInfo;
  finished: typeof queryFinishedMatches;
  fixtures: typeof queryRoundFixtures;
  positions: typeof getTeamPositions;
  warn: (message: string, error: unknown) => void;
}) {
  return async function getRoundDetails(roundId: string | number) {
    // Preserve the trusted legacy selector's truthiness/Number conversion, not a new HTTP validator.
    if (!roundId) return null;
    const seasonId = await deps.season();
    const info = await deps.info(roundId, seasonId);
    if (!info.length) return null;
    let positions = new Map<number, number>();
    try {
      positions = deps.positions((await deps.finished(seasonId)) as StandingsMatch[]);
    } catch (error) {
      deps.warn('Could not calculate standings:', error);
    }
    return mapRoundDetails(info[0], await deps.fixtures(roundId, seasonId), positions);
  };
}
export const getRoundDetails = createRoundDetailsService({
  season: resolveFixtureSeason,
  info: queryRoundInfo,
  finished: queryFinishedMatches,
  fixtures: queryRoundFixtures,
  positions: getTeamPositions,
  warn: console.warn,
});
