import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
const read = (path: string) =>
  readFileSync(resolve(process.cwd(), 'src/features/playoffs', path), 'utf8');
it('keeps public models independent from database records and server implementations', () => {
  expect(read('server.ts')).toMatch(/^import 'server-only';/);
  expect(read('public.ts')).not.toMatch(/queries|server|drizzle/);
  expect(read('models/playoffs.ts')).not.toMatch(/\bany\b|Date|drizzle|ReturnType/);
  expect(read('server/queries/playoffs.query.ts')).toMatch(/^import 'server-only';/);
  expect(read('server/services/playoffs.service.ts')).not.toMatch(/@\/lib\/db|drizzle/);
  expect(read('server/mappers/playoffs.mapper.ts')).not.toMatch(/@\/lib\/db|drizzle|\.\.\.p\b/);
});
