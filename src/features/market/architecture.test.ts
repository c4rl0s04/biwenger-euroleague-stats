import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const feature = (path: string) => read(`src/features/market/${path}`);

it('types aggregate and chart reads without adding server imports or cache changes', () => {
  const parent = feature('components/MarketPageClient.tsx');
  expect(parent).toContain('Partial<MarketAnalytics>');
  expect(parent).toContain('useState<MarketDrawerState>');
  const chart = feature('components/stats/MarketTrendsChart.tsx');
  expect(chart).toContain("from '../../models/market-trends'");
  expect(chart).toContain('cacheKey: `market-trends-${period.days}`');
  expect(parent + chart).not.toContain('/server');
});

it('owns typed listing composition and consumes the deliberate Players HTTP model', () => {
  expect(feature('models/market-listing-presentation.ts')).toContain(
    "from '@/features/players/public'"
  );
  expect(feature('models/market-listing-presentation.ts')).not.toMatch(
    /\bany\b|drizzle|queries|ReturnType/
  );
  expect(feature('components/MarketListingsSection.tsx')).toContain(
    'listings?: CurrentMarketListing[]'
  );
  for (const name of ['MarketPlayerCard', 'ExpandedPlayerModal']) {
    const source = feature(`components/${name}.tsx`);
    expect(source).toContain('UseMarketPlayerDetails');
    expect(source).toContain('MarketListingPresentation');
    expect(source).not.toContain('@/features/players/server');
  }
});

it('keeps metric renderer inputs explicit and the shared visual facade implementation-free', () => {
  expect(feature('models/market-metric.ts')).not.toMatch(/\bany\b|drizzle|queries|ReturnType/);
  for (const name of ['PlayerStatRow', 'UserStatRow', 'TransactionStatRow', 'TemporalStatRow']) {
    expect(feature(`components/stats/renderers/${name}.tsx`)).toContain('MarketMetricRowProps');
  }
  expect(feature('components/stats/renderers/registry.tsx')).toContain('MarketMetricDefinition');
  expect(feature('components/stats/renderers/utils.ts')).toContain('MarketRowIdentity');
  expect(feature('components/stats/renderers/BaseRow.ts')).toContain(
    'ComponentType<MarketBaseRowProps>'
  );
  expect(feature('components/stats/renderers/BaseRow.ts')).not.toContain('function');
});

it('owns the section composition and typed client-local drawer boundary', () => {
  expect(read('src/app/(app)/market/[section]/page.tsx')).not.toContain('MobileDetailScaffold');
  expect(feature('components/MarketSectionScreen.tsx')).toContain('MobileDetailScaffold');
  const model = feature('models/market-drawer.ts');
  expect(model).not.toMatch(/\bany\b|drizzle|queries|ReturnType/);
  expect(model).toContain('MarketDrawerRowsByType');
  expect(feature('components/stats/StatDetailDrawer.tsx')).toContain('}: MarketDrawerProps)');
  expect(feature('components/MarketPageClient.tsx')).toContain('MarketDrawerConfig');
});

it('owns non-bids phone projections and enforces the section route without a new exception', () => {
  const path = 'src/app/(app)/market/[section]/page.tsx';
  expect(read(path)).not.toMatch(/@\/lib\/(db|services)/);
  expect(feature('models/market-section.ts')).not.toMatch(/\bany\b|\bDate\b|drizzle|ReturnType/);
  expect(feature('components/MarketSectionRows.tsx')).not.toMatch(
    /MobileRecordList|@\/lib\/(db|services)/
  );
  expect(feature('server/services/market-section.service.ts')).toMatch(/^import 'server-only';/);
  const policy = JSON.parse(read('scripts/architecture/policy.json'));
  expect(policy.entrypoints).toContain(path);
  expect(policy.exceptions.some((entry: { edge: string }) => entry.edge.includes(path))).toBe(
    false
  );
});

it('keeps the public contract and trend models independent from server and database code', () => {
  expect(feature('public.ts')).not.toMatch(/server|queries|drizzle/);
  expect(feature('models/market-trends.ts')).not.toMatch(/\bany\b|\bDate\b|drizzle|ReturnType/);
  expect(feature('server.ts')).toMatch(/^import 'server-only';/);
  expect(feature('server/queries/market-trends.query.ts')).toMatch(/^import 'server-only';/);
  expect(feature('server/services/market-trends.service.ts')).toMatch(/^import 'server-only';/);
  expect(feature('server/services/market-trends.service.ts')).not.toMatch(
    /@\/lib\/(db|services)|drizzle/
  );
});

it('keeps the trend handler on the owned service and registers transitive graph enforcement', () => {
  const route = read('src/app/api/market/trends/route.ts');
  expect(route).toContain('@/features/market/server');
  expect(route).not.toMatch(/@\/lib\/(db|services)|queries/);
  const policy = JSON.parse(read('scripts/architecture/policy.json'));
  expect(policy.entrypoints).toContain('src/app/api/market/trends/route.ts');
  expect(
    policy.exceptions.some((entry: { edge: string }) => entry.edge.includes('api/market/trends'))
  ).toBe(false);
});

it('keeps transfer/detail services and models off legacy database-shaped boundaries', () => {
  expect(feature('models/market-transfers.ts')).not.toMatch(/\bany\b|\bDate\b|drizzle|ReturnType/);
  expect(feature('server/services/market-transfers.service.ts')).toMatch(/^import 'server-only';/);
  expect(feature('server/services/market-transfers.service.ts')).not.toMatch(
    /@\/lib\/(db|services)|drizzle/
  );
  expect(feature('server/queries/market-transfers.query.ts')).toMatch(/^import 'server-only';/);
  expect(feature('server/mappers/market-transfers.mapper.ts')).not.toMatch(/\.\.\.row|@\/lib\/db/);
  const policy = JSON.parse(read('scripts/architecture/policy.json'));
  for (const suffix of ['transfers', 'stats/value-details', 'duels/details']) {
    const path = `src/app/api/market/${suffix}/route.ts`;
    expect(read(path)).toContain('@/features/market/server');
    expect(read(path)).not.toMatch(/@\/lib\/(db|services)|queries/);
    expect(policy.entrypoints).toContain(path);
    expect(policy.exceptions.some((entry: { edge: string }) => entry.edge.includes(path))).toBe(
      false
    );
  }
});

it('owns catalogue orchestration with deliberate cross-feature contracts and allowlisted models', () => {
  const service = feature('server/services/market-catalogue.service.ts');
  expect(service).toContain("from '@/features/players/server'");
  expect(service).toContain("from '@/features/teams/server'");
  expect(service).not.toMatch(/@\/lib\/(db|services)|playerForm|\bany\b/);
  const query = feature('server/queries/market-catalogue.query.ts');
  expect(query).toMatch(/^import 'server-only';/);
  expect(query).not.toMatch(/features\/players|features\/teams|services\//);
  expect(feature('models/market-catalogue.ts')).not.toMatch(/\bany\b|\bDate\b|drizzle|queries/);
  expect(feature('server/mappers/market-catalogue.mapper.ts')).not.toContain('...row');
  expect(read('src/lib/db/queries/features/market.ts')).not.toContain('getPlayerFormMap');
});

it('owns every remaining analytics query, projection and stats HTTP boundary', () => {
  expect(read('src/lib/db/queries/features/market.ts')).not.toMatch(
    /SELECT|pgClient|resolveReadSeasonId|export async function/
  );
  expect(read('src/lib/services/marketService.ts')).not.toMatch(
    /\bany\b|Promise.all|from ['"].*db/
  );
  const service = feature('server/services/market-analytics.service.ts');
  expect(service).toContain("from '@/features/managers/server'");
  expect(service).not.toMatch(/@\/lib\/(db|services)|\bany\b/);
  for (const group of ['summary', 'auctions', 'investments', 'activity-extra', 'overview']) {
    expect(feature(`models/market-${group}.ts`)).not.toMatch(/\bany\b|\bDate\b|drizzle|queries/);
    expect(feature(`server/queries/market-${group}.query.ts`)).toMatch(/^import 'server-only';/);
    expect(feature(`server/mappers/market-${group}.mapper.ts`)).not.toMatch(/\.\.\.row|\bany\b/);
    expect(feature(`server/services/market-${group}.service.ts`)).not.toMatch(
      /@\/lib\/(db|services)|\bany\b/
    );
  }
  const path = 'src/app/api/market/stats/route.ts';
  expect(read(path)).toContain('@/features/market/server');
  const policy = JSON.parse(read('scripts/architecture/policy.json'));
  expect(policy.entrypoints).toContain(path);
  expect(policy.exceptions.some((entry: { edge: string }) => entry.edge.includes(path))).toBe(
    false
  );
});

it('owns basic activity orchestration and registers its HTTP boundary', () => {
  expect(feature('models/market-activity.ts')).not.toMatch(/\bany\b|\bDate\b|drizzle|ReturnType/);
  expect(feature('server/services/market-activity.service.ts')).toMatch(/^import 'server-only';/);
  expect(feature('server/services/market-activity.service.ts')).not.toMatch(
    /@\/lib\/(db|services)|drizzle/
  );
  expect(feature('server/queries/market-activity.query.ts')).toMatch(/^import 'server-only';/);
  expect(read('src/app/api/market/route.ts')).toContain('@/features/market/server');
  expect(read('src/app/api/market/route.ts')).not.toMatch(/@\/lib\/(db|services)|queries/);
  expect(read('src/lib/services/features/marketService.ts')).toContain(
    "export { getMarketPageData } from '@/features/market/server'"
  );
  expect(read('src/lib/services/features/marketService.ts')).not.toContain('Promise.all');
  const policy = JSON.parse(read('scripts/architecture/policy.json'));
  expect(policy.entrypoints).toContain('src/app/api/market/route.ts');
  expect(
    policy.exceptions.some((entry: { edge: string }) =>
      entry.edge.includes('src/app/api/market/route.ts')
    )
  ).toBe(false);
});
