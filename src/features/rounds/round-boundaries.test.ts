import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import policy from '../../../scripts/architecture/policy.json';

const pages = [
  'src/app/(app)/rounds/page.tsx',
  'src/app/(app)/rounds/[roundId]/[section]/page.tsx',
];
const routes = [
  'all-history',
  'history',
  'leaderboard',
  'lineup-stats',
  'lineup',
  'list',
  'standings',
  'stats',
].map((name) => `src/app/api/rounds/${name}/route.ts`);

describe('Rounds architecture registration', () => {
  it('protects both pages and every existing Rounds HTTP adapter', () => {
    for (const file of [...pages, ...routes]) {
      expect(policy.entrypoints).toContain(file);
      const source = readFileSync(file, 'utf8');
      expect(source).toContain('@/features/rounds/server');
      expect(source).not.toMatch(/@\/lib\/(?:db|services)|Record<string,\s*any>/);
    }
  });
  it('limits existing page-auth debt to six exact infrastructure edges per page', () => {
    for (const page of pages) {
      const exceptions = policy.exceptions.filter((entry) =>
        entry.edge.startsWith(`entrypoint-persistence: ${page} -> `)
      );
      expect(exceptions).toHaveLength(6);
      for (const entry of exceptions) {
        expect(entry.edge).toMatch(
          / -> (src\/auth\.js|src\/lib\/credentials\/repository\.ts) -> (drizzle-orm|src\/lib\/db\/(index|schema)\.ts)$/
        );
        expect(entry.removeWhen).toContain('security gate');
      }
    }
    expect(
      policy.exceptions.filter((entry) => routes.some((route) => entry.edge.includes(route)))
    ).toEqual([]);
  });
  it('keeps mobile presentation independent from loose database-shaped record renderers', () => {
    for (const file of ['MobileRoundsScreen.tsx', 'RoundSectionScreen.tsx', 'RoundRows.tsx']) {
      const source = readFileSync(`src/features/rounds/components/${file}`, 'utf8');
      expect(source).not.toMatch(/MobileRecordList|Record<string,\s*any>|\/server|drizzle/);
    }
  });
});
