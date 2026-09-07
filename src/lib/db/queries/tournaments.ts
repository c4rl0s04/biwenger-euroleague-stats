// Legacy query names remain adapters until tournament screens/global analytics migrate.
export {
  getTournaments,
  getTournamentById,
  getTournamentStandings,
  getTournamentFixtures,
  getUserTournaments,
} from '@/features/tournaments/server';
export type {
  Tournament,
  TournamentStanding,
  TournamentFixture,
} from '@/features/tournaments/public';
