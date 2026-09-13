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
