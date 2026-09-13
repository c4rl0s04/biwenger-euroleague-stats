import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('teams feature boundaries', () => {
  it('keeps competition orchestration above queries and Market behind the Team contract', () => {
    for (const file of ['team-profile.query.ts', 'team-competition.query.ts']) {
      const query = source(`./server/queries/${file}`);
      expect(query).not.toContain('/services/');
      expect(query).not.toContain('core/teams');
    }
    const marketService = source('../market/server/services/market-catalogue.service.ts');
    expect(marketService).toContain("from '@/features/teams/server'");
    expect(marketService).not.toContain('core/teams');
    expect(source('./public.ts')).not.toContain('team-profile-facts');
  });

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
