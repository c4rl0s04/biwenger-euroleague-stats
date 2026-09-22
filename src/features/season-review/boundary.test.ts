import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(p, 'utf8');
const files = (p: string): string[] =>
  readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(p, e.name)) : [join(p, e.name)]
  );

describe('Season Review feature boundary', () => {
  it('enforces server-only contracts on server entrypoints and services', () => {
    expect(read('src/features/season-review/server.ts')).toMatch(/^import 'server-only'/);

    for (const p of files('src/features/season-review/server/services').filter(
      (f) => !f.includes('.test.')
    )) {
      expect(read(p)).toMatch(/^import 'server-only'/);
    }

    for (const p of files('src/features/season-review/server/queries').filter(
      (f) => !f.includes('.test.')
    )) {
      expect(read(p)).toMatch(/^import 'server-only'/);
    }
  });

  it('keeps public.ts and models completely client-safe without server or db dependencies', () => {
    const publicSource = read('src/features/season-review/public.ts');
    expect(publicSource).not.toMatch(/server|pgClient|@\/lib\/db|fs/);

    for (const p of files('src/features/season-review/models').filter(
      (f) => !f.includes('.test.')
    )) {
      const source = read(p);
      expect(source).not.toMatch(/server-only|pgClient|@\/lib\/db|node:fs|from 'fs'/);
    }
  });

  it('ensures no untyped any or Record<string, any> in feature contracts', () => {
    const serverSource = read('src/features/season-review/server.ts');
    const publicSource = read('src/features/season-review/public.ts');

    expect(serverSource).not.toMatch(/Record<string, any>|:\s*any\b/);
    expect(publicSource).not.toMatch(/Record<string, any>|:\s*any\b/);
  });
});
