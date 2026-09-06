import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
it('keeps client-safe models independent from query declarations', () => {
  expect(read('src/features/standings/public.ts')).not.toMatch(/server|queries|lib\/db/);
  expect(read('src/features/standings/models/base-standings.ts')).not.toMatch(
    /import|\bany\b|ReturnType/
  );
  expect(read('src/features/standings/server.ts').startsWith("import 'server-only';")).toBe(true);
});
it('routes and the base page share the owning service contract', () => {
  for (const path of [
    'src/app/(app)/standings/page.js',
    'src/app/api/standings/full/route.ts',
    'src/app/api/standings/league-totals/route.ts',
    'src/app/api/standings/value-ranking/route.ts',
  ]) {
    const source = read(path);
    expect(source).toContain("from '@/features/standings/server'");
    expect(source).not.toMatch(/from ['"].*(?:lib\/db|lib\/services|\/queries\/)/);
    expect(source).toContain("dynamic = 'force-dynamic'");
  }
});
it('retains one implementation behind the legacy query adapter without a barrel cycle', () => {
  expect(read('src/lib/db/queries/competition/standings.ts')).toContain(
    "from '@/features/standings/server'"
  );
  expect(read('src/features/standings/server/queries/base-standings.query.ts')).toContain(
    "from '@/lib/db/connection'"
  );
  expect(read('src/features/standings/server/queries/base-standings.query.ts')).not.toMatch(
    /from ['"]@\/lib\/db['"]/
  );
});
