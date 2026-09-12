import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');
it('keeps tournament server markers, client-safe models and persistence ownership explicit', () => {
  for (const path of [
    'server.ts',
    'server/queries/tournament.query.ts',
    'server/services/tournament-read.service.ts',
    'server/services/tournament-statistics.service.ts',
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

it('keeps global statistics in a typed feature calculation without obsolete service adapters', () => {
  const service = read('src/features/tournaments/server/services/tournament-statistics.service.ts');
  const mapper = read('src/features/tournaments/server/mappers/tournament-statistics.mapper.ts');
  const models = read('src/features/tournaments/models/tournament-statistics.ts');
  for (const source of [service, mapper, models]) {
    expect(source).not.toMatch(/\bany\b|@\/lib\/db|@\/lib\/services/);
  }
  expect(mapper).not.toMatch(/\bawait\b|\bfetch\s*\(|\bquery\s*\(/);
  expect(service).toContain("serverCache: 'none;");
  for (const path of [
    'src/lib/services/statsService.ts',
    'src/lib/services/tournamentService.ts',
    'src/features/tournaments/components/TournamentCard.js',
  ]) {
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
  }
});
