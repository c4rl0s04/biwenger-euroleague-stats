import 'server-only';
import { resolveTeamProfileSeason as resolveReadSeasonId } from '../queries/team-profile.query';
import { getPlayerFormMap } from '@/features/player-form/server';
import { readTeamRosterRows, type TeamRosterRow } from '../queries/team-profile.query';

export async function listTeamRoster(teamId: number): Promise<TeamRosterRow[]> {
  const seasonId = await resolveReadSeasonId();

  const [rows, formMap] = await Promise.all([
    readTeamRosterRows(teamId, seasonId),
    getPlayerFormMap(),
  ]);

  return rows.map((row: TeamRosterRow) => ({
    ...row,
    recent_scores: formMap.get(Number(row.id))?.recent_scores ?? null,
  }));
}
