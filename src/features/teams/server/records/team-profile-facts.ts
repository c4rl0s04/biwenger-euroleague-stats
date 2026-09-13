import type { TeamProfileDetailsRow } from '../queries/team-profile.query';
/** Internal assembled records, consumed by the profile mapper; never a public view model. */
export interface TeamProfileDetailsFacts {
  row: TeamProfileDetailsRow;
  matchesPlayed: number;
  playoffProbability: number;
  rank: number | string | null;
}
