import 'server-only';
import { fetchRoundsList } from './round-list.service';
import { fetchRoundCompleteData, fetchRoundStandings } from './round-results.service';
import { getUserPerformanceHistoryService } from './round-history.service';
import { mapRoundOverview, mapRoundRows } from '../mappers/round-screen.mapper';
import type { RoundSectionViewModel } from '../../models/round-screen';

export const ROUND_SCREEN_POLICY = {
  access:
    'Parent application guard and existing page auth; explicit manager identity passed by page',
  cache: 'No added cache; retain underlying read freshness and desktop browser loading',
} as const;
export interface RoundScreenDependencies {
  lists: typeof fetchRoundsList;
  complete: typeof fetchRoundCompleteData;
  standings: typeof fetchRoundStandings;
  history: typeof getUserPerformanceHistoryService;
}
export function createRoundScreenService(deps: RoundScreenDependencies) {
  async function getRoundOverviewData(
    userId?: string | number,
    requestedRound?: string | number | null
  ) {
    const lists = await deps.lists();
    const activeRoundId = requestedRound ?? lists.defaultRoundId ?? lists.rounds[0]?.round_id;
    const data = userId && activeRoundId ? await deps.complete(activeRoundId, userId) : null;
    return mapRoundOverview(lists, activeRoundId, data, userId);
  }
  async function getRoundSectionData(
    roundId: string,
    section: string,
    userId?: string | number
  ): Promise<RoundSectionViewModel> {
    const roundData = userId ? await deps.complete(roundId, userId) : null;
    const user = roundData?.users?.[0];
    const data =
      section === 'history'
        ? userId
          ? await deps.history(userId)
          : []
        : section === 'comparison'
          ? await deps.standings(roundId)
          : section === 'stats'
            ? [roundData?.global, ...(roundData?.idealLineup ?? [])]
            : (user?.lineup?.players ?? []);
    return {
      rows: mapRoundRows(data, section === 'lineup' || section === 'stats' ? '/player' : undefined),
      points: user?.points ?? 0,
      ideal: user?.ideal_points ?? 0,
    };
  }
  return { getRoundOverviewData, getRoundSectionData };
}
export const { getRoundOverviewData, getRoundSectionData } = createRoundScreenService({
  lists: fetchRoundsList,
  complete: fetchRoundCompleteData,
  standings: fetchRoundStandings,
  history: getUserPerformanceHistoryService,
});
