import 'server-only';
export {
  getManagerCaptainRecommendations,
  getManagerPersonalizedAlerts,
  MANAGER_PREPARATION_POLICY,
} from './server/services/manager-preparation.service';
export {
  getManagerCaptainStats,
  getManagerHomeAwayStats,
  MANAGER_PERFORMANCE_POLICY,
} from './server/services/manager-performance.service';
export {
  getManagerDirectory,
  MANAGER_DIRECTORY_POLICY,
} from './server/services/manager-directory.service';
export {
  getManagerProfile,
  getManagerProfileSection,
  MANAGER_PROFILE_POLICY,
} from './server/services/manager-profile.service';
export {
  getManagerContributorsData,
  MANAGER_CONTRIBUTORS_POLICY,
} from './server/services/manager-contributors.service';
export {
  getManagerSeasonStatsData,
  getManagerSquadData,
  getManagerRoundsData,
  MANAGERS_READ_POLICY,
} from './server/services/manager-read.service';
