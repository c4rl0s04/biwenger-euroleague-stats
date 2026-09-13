import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src/features/predictions', path), 'utf8');

it('keeps the public models client-safe and calculations free of persistence imports', () => {
  expect(read('server.ts')).toMatch(/^import 'server-only';/);
  expect(read('public.ts')).not.toMatch(/server|calculations|queries/);
  expect(read('models/predictions.ts')).not.toMatch(/\bany\b|drizzle|@\/lib\/db/);
  expect(read('server/calculations/predictions.ts')).not.toMatch(
    /@\/lib|pgClient|resolveReadSeasonId|\bfetch\s*\(/
  );
});

it('centralizes persistence and prevents the obsolete query adapters returning', () => {
  const query = read('server/queries/predictions.query.ts');
  expect(query).toMatch(/^import 'server-only';/);
  expect(query).toContain('@/lib/db/connection');
  expect(query).not.toContain("@/lib/db'");
  for (const path of [
    'server/mappers/predictions.mapper.ts',
    'server/services/predictions-read.service.ts',
  ])
    expect(read(path)).not.toMatch(/\bany\b|@\/lib\/db/);
  for (const file of ['predictions.ts', 'prediction-normalization-sql.ts'])
    expect(existsSync(resolve(process.cwd(), 'src/lib/db/queries/features', file))).toBe(false);
});
