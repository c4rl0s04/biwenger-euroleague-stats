import 'server-only';

export { fetchRoundsList } from './server/services/round-list.service';
export {
  fetchRoundStandings,
  fetchRoundCompleteData,
  fetchUserLineup,
  fetchUserRoundDetails,
} from './server/services/round-results.service';
export {
  getUserPerformanceHistoryService,
  fetchRoundLeaderboard,
  fetchAllUsersPerformanceHistory,
} from './server/services/round-history.service';
export { fetchLineupStats } from './server/services/formation-usage.service';
export { ROUNDS_READ_POLICY } from './server/services/round-read-policy';
export { readRoundHttpInput } from './validation/round-http-input';
export {
  getRoundOverviewData,
  getRoundSectionData,
  ROUND_SCREEN_POLICY,
} from './server/services/round-screen.service';

// Existing database-name adapters require these query contracts. Screens/pages
// use the mapped services above, never these persistence-shaped projections.
export {
  getAllRounds,
  getUserLineup,
  hasOfficialStats,
  getOfficialStandings,
  getLivingStandings,
  getCoachRating,
  getRoundGlobalStats,
  getIdealLineup,
  getPlayersLeftOut,
  getUserRoundsHistoryDAO,
  getUserOptimization,
  getLineupUsageStats,
} from './server/queries/round-analysis.query';

export {
  getRoundCalendar,
  resolveRoundIdByPolicy,
  getLastCompletedRoundId,
  getLastCompletedCalendarRound,
} from './server/services/calendar.service';
