import 'server-only';
import {
  resolveTeamProfileSeason,
  readTeamProfileDetailsRow,
  listRegularSeasonStandings,
} from '../queries/team-profile.query';
import { getTeamMatchesCount, getTeamPlayoffProbability } from './team-competition.service';
import type { TeamProfileDetailsFacts } from '../records/team-profile-facts';

/** Preserve the original shared detail/rank season and concurrent metric reads. */
export async function findTeamProfileDetails(
  teamId: number
): Promise<TeamProfileDetailsFacts | null> {
  const seasonId = await resolveTeamProfileSeason();
  const [row, matchesPlayed, playoffProbability, standings] = await Promise.all([
    readTeamProfileDetailsRow(teamId, seasonId),
    getTeamMatchesCount(teamId),
    getTeamPlayoffProbability(teamId),
    listRegularSeasonStandings(seasonId),
  ]);
  if (!row) return null;
  return {
    row,
    matchesPlayed,
    playoffProbability,
    rank: standings.find((entry) => Number(entry.team_id) === teamId)?.rank ?? 0,
  };
}
