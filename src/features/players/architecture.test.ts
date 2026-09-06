import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function source(relativePath: string) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('players feature boundaries', () => {
  it('keeps the public barrel client-safe and query/server barrels server-only', () => {
    const publicSource = source('./public.ts');
    const serverSource = source('./server.ts');
    const querySource = source('./server/queries/player.query.ts');
    expect(publicSource).not.toContain("from './server");
    expect(publicSource).not.toContain('server-only');
    expect(serverSource.trimStart()).toMatch(/^import ['"]server-only['"]/);
    expect(querySource.trimStart()).toMatch(/^import ['"]server-only['"]/);
  });

  it('keeps every Player page and handler behind the feature server contract', () => {
    const entryPoints = [
      '../../app/(app)/players/page.js',
      '../../app/(app)/players/[section]/page.tsx',
      '../../app/(app)/player/[id]/page.js',
      '../../app/(app)/player/[id]/[section]/page.tsx',
      '../../app/api/player/streaks/route.ts',
      '../../app/api/players/[id]/stats/route.ts',
    ].map(source);
    for (const entryPoint of entryPoints) {
      expect(entryPoint).toContain("from '@/features/players/server'");
      expect(entryPoint).not.toContain("from '@/lib/db");
      expect(entryPoint).not.toContain("from '@/lib/services");
    }
  });

  it('uses Team barrels only and removes obsolete Player implementations', () => {
    const mapperSource = source('./server/mappers/player.mapper.ts');
    const serviceSource = source('./server/services/player-profile.service.ts');
    const serviceBarrel = source('../../lib/services/index.ts');
    expect(mapperSource).toContain("from '@/features/teams/public'");
    expect(serviceSource).toContain("from '@/features/teams/server'");
    expect(serviceSource).not.toMatch(/features\/teams\/(server|components|models)\//);
    expect(serviceBarrel).not.toContain('playerService');
    expect(
      existsSync(new URL('../../components/player-profile/PlayerProfileClient.js', import.meta.url))
    ).toBe(false);
    expect(
      existsSync(new URL('../../components/players-list/PlayersDiscovery.js', import.meta.url))
    ).toBe(false);
    expect(existsSync(new URL('../../lib/db/queries/core/players.ts', import.meta.url))).toBe(
      false
    );
  });

  it('preserves the Lineup squad URL while the route reuses the Managers contract', () => {
    const lineupSource = source('../../components/mobile/screens/MobileLineupClient.tsx');
    const routeSource = source('../../app/api/player/squad/route.ts');
    expect(lineupSource).toContain('/api/player/squad?userId=${userId}');
    expect(routeSource).toContain('getRequestUserId(request)');
    expect(routeSource).toContain('getManagerSquadData(userIdValidation.value)');
  });

  it('keeps the existing Player profile HTTP shape behind an explicit adapter', () => {
    const routeSource = source('../../app/api/players/[id]/stats/route.ts');
    expect(routeSource).toContain('getPlayerProfileApiData(id)');
    expect(source('./server/services/player-profile.service.ts')).toContain(
      'toPlayerProfileApiModel(read.model, read.result)'
    );
  });
});
