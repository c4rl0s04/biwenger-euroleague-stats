import 'server-only';

// Temporary catalogue/global-barrel compatibility; one feature-owned implementation.
export { getGlobalTournamentStats } from '@/features/tournaments/server';
export type { HallOfFameEntry, GlobalUserStats } from '@/features/tournaments/public';
