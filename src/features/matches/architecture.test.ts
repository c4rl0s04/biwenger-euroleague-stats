import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('matches feature boundaries', () => {
  it('keeps the public barrel client-safe and marks the server barrel explicitly', () => {
    const publicSource = readFileSync(new URL('./public.ts', import.meta.url), 'utf8');
    const serverSource = readFileSync(new URL('./server.ts', import.meta.url), 'utf8');

    expect(publicSource).not.toContain("from './server");
    expect(publicSource).not.toContain('server-only');
    expect(serverSource.trimStart()).toMatch(/^import ['"]server-only['"]/);
  });

  it('keeps pages and HTTP routes behind the feature service boundary', () => {
    const pageSource = readFileSync(
      new URL('../../app/(app)/matches/page.tsx', import.meta.url),
      'utf8'
    );
    const routeSource = readFileSync(
      new URL('../../app/api/matches/[id]/shots/route.ts', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain("from '@/features/matches/server'");
    expect(pageSource).not.toContain("from '@/lib/db");
    expect(pageSource).not.toContain("from '@/lib/services");
    expect(routeSource).toContain("from '@/features/matches/server'");
    expect(routeSource).not.toContain("from '@/lib/db");
  });
});
