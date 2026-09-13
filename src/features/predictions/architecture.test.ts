import { readFileSync } from 'node:fs';
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
