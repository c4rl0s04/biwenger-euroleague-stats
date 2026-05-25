import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

type ContractStatus = 'covered' | 'exempted';

interface RouteContractEntry {
  status: ContractStatus;
  reason: string;
}

const ROUTE_CONTRACT_MANIFEST: Record<string, RouteContractEntry> = {
  '/api/assistant': { status: 'covered', reason: 'assistant handler contract tests' },
  '/api/assistant/conversations': { status: 'covered', reason: 'assistant handler contract tests' },
  '/api/assistant/conversations/[id]': {
    status: 'covered',
    reason: 'assistant handler contract tests',
  },
  '/api/auth/[...nextauth]': { status: 'exempted', reason: 'NextAuth handler passthrough' },
  '/api/compare/data': { status: 'covered', reason: 'compare handler contract tests' },
  '/api/compare/data/lite': { status: 'covered', reason: 'compare handler contract tests' },
  '/api/dashboard/birthdays': { status: 'covered', reason: 'dashboard handler contract tests' },
  '/api/dashboard/captain-stats': { status: 'covered', reason: 'handler contract tests' },
  '/api/dashboard/captain-suggest': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/dashboard/home-away': { status: 'covered', reason: 'handler contract tests' },
  '/api/dashboard/ideal-lineup': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/dashboard/leader-gap': { status: 'covered', reason: 'handler contract tests' },
  '/api/dashboard/market-opportunities': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/dashboard/mvps': { status: 'covered', reason: 'handler contract tests' },
  '/api/dashboard/next-round': { status: 'covered', reason: 'handler contract tests' },
  '/api/dashboard/recent-activity': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/dashboard/rising-stars': { status: 'covered', reason: 'dashboard handler contract tests' },
  '/api/dashboard/top-form': { status: 'covered', reason: 'dashboard handler contract tests' },
  '/api/dashboard/top-players': { status: 'covered', reason: 'dashboard handler contract tests' },
  '/api/hoopgrid/guess': { status: 'covered', reason: 'handler contract tests' },
  '/api/hoopgrid/list': { status: 'covered', reason: 'handler contract tests' },
  '/api/hoopgrid/today': { status: 'covered', reason: 'handler contract tests' },
  '/api/landing-stats': { status: 'covered', reason: 'handler contract tests' },
  '/api/league-average': { status: 'covered', reason: 'handler contract tests' },
  '/api/market': { status: 'covered', reason: 'market handler contract tests' },
  '/api/market/duels/details': { status: 'covered', reason: 'market handler contract tests' },
  '/api/market/offers/accept': { status: 'covered', reason: 'handler contract tests' },
  '/api/market/offers/reject': { status: 'covered', reason: 'handler contract tests' },
  '/api/market/remove': { status: 'covered', reason: 'handler contract tests' },
  '/api/market/sell': { status: 'covered', reason: 'handler contract tests' },
  '/api/market/sell-all': { status: 'covered', reason: 'handler contract tests' },
  '/api/market/stats': { status: 'covered', reason: 'handler contract tests' },
  '/api/market/stats/value-details': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/market/transfers': { status: 'covered', reason: 'market handler contract tests' },
  '/api/market/trends': { status: 'covered', reason: 'market handler contract tests' },
  '/api/news': { status: 'covered', reason: 'handler contract tests' },
  '/api/player/rounds': { status: 'covered', reason: 'player handler contract tests' },
  '/api/player/squad': { status: 'covered', reason: 'player handler contract tests' },
  '/api/player/stats': { status: 'covered', reason: 'player handler contract tests' },
  '/api/player/streaks': { status: 'covered', reason: 'handler contract tests' },
  '/api/players/[id]/stats': { status: 'covered', reason: 'handler contract tests' },
  '/api/rounds/all-history': { status: 'covered', reason: 'handler contract tests' },
  '/api/rounds/history': { status: 'covered', reason: 'handler contract tests' },
  '/api/rounds/leaderboard': { status: 'covered', reason: 'handler contract tests' },
  '/api/rounds/lineup': { status: 'covered', reason: 'handler contract tests' },
  '/api/rounds/lineup-stats': { status: 'covered', reason: 'handler contract tests' },
  '/api/rounds/list': { status: 'covered', reason: 'rounds handler contract tests' },
  '/api/rounds/standings': { status: 'covered', reason: 'handler contract tests' },
  '/api/rounds/stats': { status: 'covered', reason: 'handler contract tests' },
  '/api/search': { status: 'covered', reason: 'search handler contract tests' },
  '/api/standings/advanced': { status: 'covered', reason: 'handler contract tests' },
  '/api/standings/analytics': { status: 'covered', reason: 'handler contract tests' },
  '/api/standings/bottlers': { status: 'covered', reason: 'handler contract tests' },
  '/api/standings/captains': { status: 'covered', reason: 'handler contract tests' },
  '/api/standings/efficiency': { status: 'covered', reason: 'standings handler contract tests' },
  '/api/standings/full': { status: 'covered', reason: 'standings handler contract tests' },
  '/api/standings/heartbreakers': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/standings/initial-squad-stats': {
    status: 'covered',
    reason: 'standings handler contract tests',
  },
  '/api/standings/jinx': { status: 'covered', reason: 'handler contract tests' },
  '/api/standings/league-comparison': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/standings/league-totals': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/standings/no-glory': { status: 'covered', reason: 'handler contract tests' },
  '/api/standings/placements': { status: 'covered', reason: 'handler contract tests' },
  '/api/standings/points-progression': {
    status: 'covered',
    reason: 'standings handler contract tests',
  },
  '/api/standings/round-winners': { status: 'covered', reason: 'standings handler contract tests' },
  '/api/standings/streaks': { status: 'covered', reason: 'standings handler contract tests' },
  '/api/standings/theoretical': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/standings/value-ranking': {
    status: 'covered',
    reason: 'handler contract tests',
  },
  '/api/standings/volatility': { status: 'covered', reason: 'standings handler contract tests' },
  '/api/stats/leaders': { status: 'covered', reason: 'handler contract tests' },
  '/api/team/[id]': { status: 'covered', reason: 'handler contract tests' },
  '/api/user/change-password': { status: 'covered', reason: 'handler contract tests' },
  '/api/user/link-biwenger': { status: 'covered', reason: 'handler contract tests' },
  '/api/users': { status: 'covered', reason: 'handler contract tests' },
  '/api/users/lineup': { status: 'covered', reason: 'handler contract tests' },
};

const testDir = path.dirname(fileURLToPath(import.meta.url));
const apiDir = path.resolve(testDir, '..');

function findRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findRouteFiles(fullPath);
    return /^route\.(js|ts)$/.test(entry.name) ? [fullPath] : [];
  });
}

function routePathFromFile(file: string): string {
  const relative = path.relative(apiDir, file);
  return `/api/${relative
    .replace(/\/route\.(js|ts)$/, '')
    .split(path.sep)
    .join('/')}`;
}

describe('API route contract manifest', () => {
  it('requires every API route to be covered or explicitly exempted', () => {
    const actualRoutes = findRouteFiles(apiDir).map(routePathFromFile).sort();
    const manifestRoutes = Object.keys(ROUTE_CONTRACT_MANIFEST).sort();

    expect(actualRoutes).toEqual(manifestRoutes);
  });

  it('requires every exemption to explain why contract tests are not present yet', () => {
    const exemptions = Object.entries(ROUTE_CONTRACT_MANIFEST).filter(
      ([, entry]) => entry.status === 'exempted'
    );

    expect(exemptions.length).toBeGreaterThan(0);
    for (const [route, entry] of exemptions) {
      expect(entry.reason, route).toMatch(/\S{8,}/);
    }
  });
});
