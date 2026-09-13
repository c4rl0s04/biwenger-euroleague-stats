import 'server-only';
import { readPlayoffFacts } from '../queries/playoffs.query';
import { mapPlayoffLeaderboard } from '../mappers/playoffs.mapper';
export const PLAYOFF_READ_POLICY = {
  serverCache: 'none',
  pageRevalidate: 600,
  access: 'existing page authorization; competition statistics',
  mutations: 'none',
} as const;
export async function getPlayoffLeaderboard() {
  return mapPlayoffLeaderboard(await readPlayoffFacts());
}
