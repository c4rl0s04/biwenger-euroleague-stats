import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
const read = (path: string) => readFileSync(path, 'utf8');
function files(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(path, e.name)) : [join(path, e.name)]
  );
}
describe('News ownership', () => {
  it('keeps app-shell composition out of the generic layout barrel', () => {
    expect(read('src/components/layout/index.js')).not.toContain('./AppShell');
    expect(read('src/app/(app)/layout.js')).toContain('@/components/layout/AppShell');
  });
  it('uses explicit server-only services and client-safe exports', () => {
    expect(read('src/features/news/server.ts')).toMatch(/^import 'server-only'/);
    expect(read('src/features/news/public.ts')).not.toMatch(/server\/|server-only/);
    for (const path of files('src/features/news').filter((p) => !p.includes('.test.'))) {
      expect(read(path)).not.toMatch(/@\/lib\/db|@\/lib\/services|Record<string, any>|:\s*any\b/);
      expect(read(path)).not.toMatch(/@\/features\/(market|matches)\/(?!public|server['"])/);
    }
  });
  it('routes and server page share the service; widgets use public ownership', () => {
    for (const path of ['src/app/api/news/route.ts', 'src/app/(app)/dashboard/page.tsx'])
      expect(read(path)).toContain('@/features/news/server');
    for (const path of [
      'src/components/layout/AppShell.js',
      'src/features/dashboard/screens/MobileDashboardScreen.tsx',
    ])
      expect(read(path)).toContain('@/features/news/public');
    expect(existsSync('src/components/ui/NewsTicker.js')).toBe(false);
    expect(existsSync('src/components/mobile/MobileNewsStrip.tsx')).toBe(false);
    expect(read('src/lib/services/app/news-landing-legacy.ts')).not.toContain('fetchNewsFeed');
    expect(read('src/lib/db/queries/competition/matches.ts')).not.toMatch(
      /function getUpcomingMatches|function getRecentResults/
    );
  });
  it('protects News HTTP and removes Dashboard News exceptions', () => {
    const policy = read('scripts/architecture/policy.json');
    expect(policy).toContain('src/app/api/news/route.ts');
    expect(policy).not.toContain('news-landing-legacy');
  });
  it('retains parameterless identity-independent HTTP and ticker request behavior', () => {
    const route = read('src/app/api/news/route.ts');
    expect(route).toContain('async function GET()');
    expect(route).not.toMatch(/cookies\(|headers\(|auth\(|getRequestUserId/);
    const ticker = read('src/features/news/components/NewsTicker.jsx');
    expect(ticker).toContain("useApiData('/api/news'");
    expect(ticker).not.toMatch(/cacheKey|cacheTTL/);
    expect(ticker).toContain('if (loading || !news || news.length === 0) return null');
    expect(ticker).toContain('speed={40}');
  });
});
