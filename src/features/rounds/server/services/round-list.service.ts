import 'server-only';
import type { RoundsListViewModel } from '../../models/round-read';
import { readManagerDirectory } from '../queries/directory.query';
import { getAllRounds } from '../queries/round-analysis.query';
import { mapRoundManager, mapRoundOption } from '../mappers/round-read.mapper';
import {
  getLastCompletedCalendarRound,
  resolveRoundIdByPolicy,
  getRoundCalendarState,
} from './calendar.service';

export function createRoundsListService(deps: {
  calendar: typeof getRoundCalendarState;
  rounds: typeof getAllRounds;
  managers: typeof readManagerDirectory;
  lastCompleted: typeof getLastCompletedCalendarRound;
  resolveRound: typeof resolveRoundIdByPolicy;
}) {
  async function fetchRoundsList(): Promise<RoundsListViewModel> {
    // Preserve the historical discarded last-completed read: it can reject and
    // takes its own snapshots. This refactor does not silently alter freshness.
    const [rounds, users, , calendar] = await Promise.all([
      deps.rounds(),
      deps.managers(),
      deps.lastCompleted(),
      deps.calendar(),
    ]);
    const defaultRoundId = (await deps.resolveRound('active_or_last')) ?? null;
    return {
      rounds: rounds.map((round) => ({
        ...mapRoundOption(round),
        status:
          calendar.rounds.find((entry) => entry.roundId === round.round_id)?.status ?? 'upcoming',
      })),
      users: users.map(mapRoundManager),
      defaultRoundId,
    };
  }
  return { fetchRoundsList };
}
export const { fetchRoundsList } = createRoundsListService({
  calendar: getRoundCalendarState,
  rounds: getAllRounds,
  managers: readManagerDirectory,
  lastCompleted: getLastCompletedCalendarRound,
  resolveRound: resolveRoundIdByPolicy,
});
