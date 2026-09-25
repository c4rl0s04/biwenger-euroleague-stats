import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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

  it('ensures lineupReadService is only exported by server.ts', async () => {
    const serverModule = await import('../../server');
    expect(serverModule.lineupReadService).toBeDefined();
    expect(typeof serverModule.lineupReadService.getLineup).toBe('function');

    const publicModule = await import('../../public');
    expect((publicModule as Record<string, unknown>).lineupReadService).toBeUndefined();
  });
});
