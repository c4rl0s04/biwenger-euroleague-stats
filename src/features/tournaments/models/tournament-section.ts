import type { TournamentStanding, TournamentFixture } from './tournaments';

export interface TournamentSectionModel {
  name: string | null;
  data: TournamentStanding[] | TournamentFixture[];
}
