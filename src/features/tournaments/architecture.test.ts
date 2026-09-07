import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
it('keeps tournament server markers, client-safe models and persistence ownership explicit', () => {
  for (const path of [
    'server.ts',
    'server/queries/tournament.query.ts',
    'server/services/tournament-read.service.ts',
  ])
    expect(read(`src/features/tournaments/${path}`)).toMatch(/^import 'server-only';/);
  expect(read('src/features/tournaments/public.ts')).not.toMatch(/server|queries/);
  expect(read('src/features/tournaments/models/tournaments.ts')).not.toMatch(/import|\bany\b/);
  expect(read('src/features/tournaments/server/services/tournament-read.service.ts')).not.toContain(
    '@/lib/db'
  );
  expect(read('src/features/tournaments/server/queries/tournament.query.ts')).toContain(
    '@/lib/db/connection'
  );
  expect(read('src/features/tournaments/server/queries/tournament.query.ts')).not.toContain(
    "@/lib/db'"
  );
});
