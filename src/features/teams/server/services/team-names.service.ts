import 'server-only';
import { readTeamNames } from '../queries/team-names.query';
import type { TeamName } from '../../models/team-name';

/** Public statistical labels; no session fallback, persistent cache or season filtering. */
export async function getTeamNames(): Promise<TeamName[]> {
  return (await readTeamNames()).map(({ id, name }) => ({ id, name }));
}
