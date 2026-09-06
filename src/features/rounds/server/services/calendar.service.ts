import 'server-only';

import { resolveReadSeasonId } from '@/lib/db/season-context';
import type { CalendarRound, RoundSelectionPolicy } from '../../models/calendar';
import { deriveRoundCalendar, selectRoundId } from '../calendar-policy';
import { mapCalendarMatch } from '../mappers/calendar.mapper';
import { listCalendarRows } from '../queries/calendar.query';

export const ROUND_CALENDAR_POLICY = {
  access: 'public competition chronology; no session or user data',
  freshness: 'uncached database read on every invocation; caller HTTP policies unchanged',
} as const;

export function createCalendarService(deps: {
  resolveSeason: () => Promise<string>;
  listRows: typeof listCalendarRows;
  now: () => Date;
}) {
  async function getRoundCalendar() {
    const seasonId = await deps.resolveSeason();
    const now = deps.now();
    return deriveRoundCalendar((await deps.listRows(seasonId)).map(mapCalendarMatch), now);
  }
  async function resolveRoundIdByPolicy(policy: RoundSelectionPolicy) {
    return selectRoundId(await getRoundCalendar(), policy);
  }
  async function getLastCompletedRoundId() {
    return resolveRoundIdByPolicy('active_or_last');
  }
  async function getLastCompletedCalendarRound(): Promise<CalendarRound | null> {
    const id = await getLastCompletedRoundId();
    if (!id) return null;
    // Keep the legacy second snapshot rather than introduce memoization during migration.
    const { currentRound, nextRound } = await getRoundCalendar();
    return currentRound?.roundId === id ? currentRound : nextRound;
  }
  return {
    getRoundCalendar,
    resolveRoundIdByPolicy,
    getLastCompletedRoundId,
    getLastCompletedCalendarRound,
  };
}

export const {
  getRoundCalendar,
  resolveRoundIdByPolicy,
  getLastCompletedRoundId,
  getLastCompletedCalendarRound,
} = createCalendarService({
  resolveSeason: resolveReadSeasonId,
  listRows: listCalendarRows,
  now: () => new Date(),
});
