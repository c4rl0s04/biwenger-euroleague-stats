import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
const read = (p: string) => readFileSync(p, 'utf8');
const files = (p: string): string[] =>
  readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(p, e.name)) : [join(p, e.name)]
  );
describe('Home feature ownership', () => {
  it('keeps server orchestration separate from client-safe exports and presentation', () => {
    expect(read('src/features/home/server.ts')).toMatch(/^import 'server-only'/);
    expect(read('src/features/home/public.ts')).not.toMatch(/server|screens/);
    for (const p of files('src/features/home').filter((p) => !p.includes('.test.'))) {
      const source = read(p);
      expect(source).not.toMatch(/@\/lib\/services|@\/lib\/home|Record<string, any>|:\s*any\b/);
      if (p.includes('/components/') || p.includes('/screens/'))
        expect(source).not.toMatch(/server\/queries|@\/lib\/db|HomeActivityRow/);
      if (p.includes('/server/services/')) expect(source).toMatch(/^import 'server-only'/);
    }
  });
  it('routes use contracts and the obsolete Home implementations are gone', () => {
    for (const p of [
      'src/app/(app)/page.tsx',
      'src/app/api/home/activity/route.ts',
      'src/app/api/landing-stats/route.ts',
    ]) {
      expect(read(p)).toContain('@/features/home/server');
      expect(read('scripts/architecture/policy.json')).toContain(p);
    }
    for (const p of [
      'src/lib/services/app/homeService.ts',
      'src/lib/services/app/news-landing-legacy.ts',
      'src/lib/db/queries/features/home-feed.ts',
      'src/lib/db/queries/features/home-summary.ts',
      'src/components/home/DesktopHome.jsx',
    ])
      expect(existsSync(p)).toBe(false);
  });
  it('preserves a single request-cache identity for AppShell and Home without caching Home results', () => {
    expect(read('src/lib/services/app/appShellService.ts')).toContain(
      'getAppStandings = getRequestStandings'
    );
    expect(read('src/features/home/server/services/summary.service.ts')).toContain(
      'standings: getRequestStandings'
    );
    expect(read('src/features/standings/server/services/request-standings.service.ts')).toContain(
      'cache(async () => getFullStandings())'
    );
    for (const p of files('src/features/home/server/services').filter((p) => !p.includes('.test.')))
      expect(read(p)).not.toMatch(/from 'react'|unstable_cache|use cache/);
  });
});
