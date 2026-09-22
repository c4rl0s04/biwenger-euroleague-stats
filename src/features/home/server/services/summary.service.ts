import 'server-only';
import { queryHomeSeasonMetadata } from '../queries/home-summary.query';
import { getRoundCalendar } from '@/features/rounds/server';
import { getRequestStandings } from '@/features/standings/server';
import { getManagerPersonalizedAlerts } from '@/features/managers/server';
import { mapHomeSummary } from '../mappers/summary.mapper';
import type { HomeSummary } from '../../models/contracts';
export function createHomeSummaryService(deps: {
  season: typeof queryHomeSeasonMetadata;
  standings: typeof getRequestStandings;
  rounds: typeof getRoundCalendar;
  alerts: typeof getManagerPersonalizedAlerts;
}) {
  return async function getHomeSummary(userId: string): Promise<HomeSummary> {
    const [season, standings, roundState, alerts] = await Promise.all([
      deps.season(),
      deps.standings(),
      deps.rounds(),
      deps.alerts(userId, 3).catch(() => []),
    ]);
    return mapHomeSummary(userId, season, standings, roundState, alerts);
  };
}
export const getHomeSummary = createHomeSummaryService({
  season: queryHomeSeasonMetadata,
  standings: getRequestStandings,
  rounds: getRoundCalendar,
  alerts: getManagerPersonalizedAlerts,
});
