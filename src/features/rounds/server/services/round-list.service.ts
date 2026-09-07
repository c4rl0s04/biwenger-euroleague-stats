import 'server-only';
import type { RoundsListViewModel } from '../../models/round-read';
import { readManagerDirectory } from '../queries/directory.query';
import { getAllRounds } from '../queries/round-analysis.query';
import { mapRoundManager, mapRoundOption } from '../mappers/round-read.mapper';
import { getLastCompletedCalendarRound, resolveRoundIdByPolicy } from './calendar.service';

export function createRoundsListService(deps: {
  rounds: typeof getAllRounds;
  managers: typeof readManagerDirectory;
  lastCompleted: typeof getLastCompletedCalendarRound;
  resolveRound: typeof resolveRoundIdByPolicy;
}) {
  async function fetchRoundsList(): Promise<RoundsListViewModel> {
    // Preserve the historical discarded last-completed read: it can reject and
    // takes its own snapshots. This refactor does not silently alter freshness.
    const [rounds, users] = await Promise.all([
      deps.rounds(),
      deps.managers(),
      deps.lastCompleted(),
    ]);
    const defaultRoundId = (await deps.resolveRound('active_or_last')) || rounds[0]?.round_id;
    return {
      rounds: rounds.map(mapRoundOption),
      users: users.map(mapRoundManager),
      defaultRoundId,
    };
  }
  return { fetchRoundsList };
}
export const { fetchRoundsList } = createRoundsListService({
  rounds: getAllRounds,
  managers: readManagerDirectory,
  lastCompleted: getLastCompletedCalendarRound,
  resolveRound: resolveRoundIdByPolicy,
});
