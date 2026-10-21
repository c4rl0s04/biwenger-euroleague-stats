import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

// Legacy .js JSX is compiled by Next; isolate presentation from this service export check.
vi.mock('../../components/LineupClient', () => ({ default: () => null }));
vi.mock('../../components/AutoAlignButton', () => ({ default: () => null }));
vi.mock('../../screens/MobileLineupClient', () => ({ default: () => null }));
vi.mock('../../screens/MobileOffersClient', () => ({ default: () => null }));
vi.mock('@/components/shell/mobile/MobileHeaderActions', () => ({ default: () => null }));

describe('Lineup feature boundary contracts', () => {
  const root = path.resolve(__dirname, '../../..');

  it('guarantees server.ts is marked server-only', () => {
    const serverFile = readFileSync(path.join(root, 'lineup/server.ts'), 'utf8');
    expect(serverFile.trimStart()).toMatch(/^import ['"]server-only['"];/);
  });

  it('guarantees public.ts does not leak server or database dependencies', () => {
    const publicFile = readFileSync(path.join(root, 'lineup/public.ts'), 'utf8');
    expect(publicFile).not.toMatch(/['"]server-only['"]/);
    expect(publicFile).not.toMatch(/\/server\b/);
    expect(publicFile).not.toMatch(/lib\/db/);
    expect(publicFile).not.toMatch(/drizzle/);
  });

  it('ensures lineupReadService and lineupCommandService are only exported by server.ts', async () => {
    const serverModule = await import('../../server');
    expect(serverModule.lineupReadService).toBeDefined();
    expect(typeof serverModule.lineupReadService.getLineup).toBe('function');
    expect(serverModule.lineupCommandService).toBeDefined();
    expect(typeof serverModule.lineupCommandService.updateLineup).toBe('function');

    const publicModule = await import('../../public');
    expect((publicModule as Record<string, unknown>).lineupReadService).toBeUndefined();
    expect((publicModule as Record<string, unknown>).lineupCommandService).toBeUndefined();
  });
});
