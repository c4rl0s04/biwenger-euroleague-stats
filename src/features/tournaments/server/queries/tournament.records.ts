import type {
  Tournament,
  TournamentStanding,
  TournamentFixture,
  ManagerTournamentRead,
} from '../../models/tournaments';

export type TournamentRecord = Omit<Tournament, 'data'>;
export type TournamentStandingRecord = Omit<TournamentStanding, 'user_color'> & {
  user_color: number | string | null | undefined;
};
export type TournamentFixtureRecord = Omit<
  TournamentFixture,
  'home_user_color' | 'away_user_color'
> & {
  home_user_color: number | string | null | undefined;
  away_user_color: number | string | null | undefined;
};
export type ManagerTournamentRecord = Omit<
  ManagerTournamentRead,
  'position' | 'points' | 'won' | 'drawn' | 'lost'
> & {
  position: number | string | null;
  points: number | string | null;
  won: number | string | null;
  drawn: number | string | null;
  lost: number | string | null;
};
