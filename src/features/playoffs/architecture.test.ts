import { existsSync, readFileSync } from 'node:fs';
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

it('keeps pages on deliberate contracts and retires old service and screen paths', () => {
  for (const path of ['page.tsx', 'predictions/[userId]/page.tsx']) {
    const page = readFileSync(resolve(process.cwd(), 'src/app/(app)/playoffs', path), 'utf8');
    expect(page).toContain('@/features/playoffs/server');
    expect(page).toContain('@/features/playoffs/public');
    expect(page).not.toMatch(/@\/lib\/(db|services)|Record<string, any>/);
  }
  for (const path of [
    'src/lib/services/features/playoffService.ts',
    'src/components/playoffs/PlayoffClient.tsx',
    'src/components/mobile/screens/MobilePlayoffsScreen.tsx',
  ])
    expect(existsSync(resolve(process.cwd(), path))).toBe(false);
});
