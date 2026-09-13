import 'server-only';
// Temporary adapter until the two Playoffs screens migrate.
export { getPlayoffLeaderboard, SCORING_RULES } from '@/features/playoffs/server';
export { getTeamNames as getTeams } from '@/features/teams/server';
