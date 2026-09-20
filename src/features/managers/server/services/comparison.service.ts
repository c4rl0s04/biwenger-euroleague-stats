import 'server-only';
import { readComparisonManagers, readComparisonSquad } from '../queries/comparison.query';
import { mapComparisonManager, mapComparisonSquadMember } from '../mappers/comparison.mapper';

export const MANAGER_COMPARISON_POLICY = Object.freeze({
  access: 'league-wide fantasy identity and statistical squad projections; no account data',
  identity: 'directory IDs, never session fallback',
  serverCache: 'none; existing season resolution per query',
});
export function createManagerComparisonService(
  deps = {
    managers: readComparisonManagers,
    squad: readComparisonSquad,
  }
) {
  return {
    async getComparisonManagers() {
      return (await deps.managers()).map(mapComparisonManager);
    },
    async getComparisonSquad(userId: string | number) {
      return (await deps.squad(userId)).map(mapComparisonSquadMember);
    },
  };
}
export const { getComparisonManagers, getComparisonSquad } = createManagerComparisonService();
