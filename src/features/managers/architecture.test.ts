import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
describe('Manager read ownership', () => {
  it('keeps public models independent from database types and server-only exports', () => {
    expect(source('./public.ts')).not.toMatch(/server|queries|lib\/db/);
    expect(source('./server.ts').startsWith("import 'server-only';")).toBe(true);
    expect(source('./models/manager-reads.ts')).not.toMatch(/\bany\b|lib\/db|queries/);
  });
  it.each(['rounds', 'stats', 'squad'])(
    'routes legacy %s HTTP calls to Managers without changing identity policy',
    (route) => {
      const file = source('../../app/api/player/' + route + '/route.ts');
      expect(file).toContain('@/features/managers/server');
      expect(file).toContain('getRequestUserId(request)');
      expect(file).toContain('privateJsonResponse(');
    }
  );
  it('removes the obsolete Players manager adapter to prevent a feature cycle', () => {
    expect(
      existsSync(new URL('../players/server/services/player-user-read.service.ts', import.meta.url))
    ).toBe(false);
    expect(source('./server/services/manager-read.service.ts')).toContain(
      '@/features/players/server'
    );
    expect(source('./server/services/manager-read.service.ts')).toContain(
      '@/features/standings/server'
    );
  });
});
