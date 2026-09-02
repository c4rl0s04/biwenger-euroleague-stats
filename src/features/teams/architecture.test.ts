import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('teams feature boundaries', () => {
  it('keeps the public barrel client-safe and marks the server barrel explicitly', () => {
    const publicSource = source('./public.ts');
    const serverSource = source('./server.ts');
    const querySource = source('./server/queries/team-profile.query.ts');

    expect(publicSource).not.toContain("from './server");
    expect(publicSource).not.toContain('server-only');
    expect(serverSource.trimStart()).toMatch(/^import ['"]server-only['"]/);
    expect(querySource.trimStart()).toMatch(/^import ['"]server-only['"]/);
  });

  it('keeps pages and the HTTP route behind the Team service boundary', () => {
    const pageSource = source('../../app/(app)/team/[id]/page.tsx');
    const sectionSource = source('../../app/(app)/team/[id]/[section]/page.tsx');
    const routeSource = source('../../app/api/team/[id]/route.ts');

    for (const entryPoint of [pageSource, sectionSource, routeSource]) {
      expect(entryPoint).toContain("from '@/features/teams/server'");
      expect(entryPoint).not.toContain("from '@/lib/db");
      expect(entryPoint).not.toContain("from '@/lib/services");
    }
  });

  it('uses only the Matches public/server contracts and removes legacy Team Profile paths', () => {
    const modelSource = source('./models/team-profile.ts');
    const serviceSource = source('./server/services/team-profile.service.ts');
    const primaryServiceBarrel = source('../../lib/services/index.ts');

    expect(modelSource).toContain("from '@/features/matches/public'");
    expect(serviceSource).toContain("from '@/features/matches/server'");
    expect(serviceSource).not.toMatch(/features\/matches\/(server|components|models)\//);
    expect(primaryServiceBarrel).not.toContain('fetchTeamProfile');
  });
});
