import 'server-only';
import { getUserSchedule } from '@/features/schedule/server';

/** Assistant compatibility only; retire when Task 20 consumes Schedule's typed contract. */
export async function getUserScheduleService(
  userId: string | number,
  targetRoundId: string | number | null = null
) {
  const result = await getUserSchedule(userId, targetRoundId);
  if (!result.found) return result;
  return {
    ...result,
    matches: result.matches.map(({ listItem: _listItem, ...match }) => ({
      ...match,
      date: match.date === null ? null : new Date(match.date),
    })),
  };
}
