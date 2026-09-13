import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const feature = (path: string) => read(`src/features/market/${path}`);

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
