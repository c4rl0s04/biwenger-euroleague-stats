import 'server-only';

/** Compatibility entrypoint for Compare, Standings and Assistant callers.
 * Implementation and typed read models now belong to Rounds.
 */
export {
  fetchRoundsList,
  fetchUserLineup,
  fetchRoundStandings,
  fetchRoundCompleteData,
  getUserPerformanceHistoryService,
  fetchRoundLeaderboard,
  fetchAllUsersPerformanceHistory,
  fetchUserRoundDetails,
  fetchLineupStats,
} from '@/features/rounds/server';
export type {
  RoundStandingViewModel as UserRoundStandings,
  UserPerformanceHistory,
} from '@/features/rounds/public';

// Retain the established Date-valued calendar projection for unmigrated server
// callers. New feature read flows never import this compatibility module.
export { getCurrentRoundState } from '../../db/queries/competition/rounds';
