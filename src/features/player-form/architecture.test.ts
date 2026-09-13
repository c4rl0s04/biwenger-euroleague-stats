import { existsSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

it('keeps the shared form boundary independent of other features and client exports type-only', () => {
  expect(read('./public.ts').trim()).toBe(
    "export type { PlayerFormEntry } from './models/player-form';"
  );
  for (const path of [
    './server.ts',
    './server/services/player-form.service.ts',
    './server/queries/player-form.query.ts',
  ]) {
    expect(read(path)).toMatch(/^import 'server-only';/);
    expect(read(path)).not.toContain('@/features/');
  }
  expect(read('./server/services/player-form.service.ts')).not.toMatch(/@\/lib\/db|\bcache\(/);
  expect(read('./server/queries/player-form.query.ts')).not.toContain('avg_form_score');
});

it('retire legacy form implementations and keep consumer orchestration above persistence', () => {
  expect(existsSync(new URL('../../lib/db/queries/core/playerForm.ts', import.meta.url))).toBe(
    false
  );
  expect(
    existsSync(new URL('../players/server/queries/player-form.query.ts', import.meta.url))
  ).toBe(false);
  for (const file of [
    '../teams/server/queries/team-profile.query.ts',
    '../players/server/queries/player.query.ts',
  ]) {
    expect(read(file)).not.toMatch(/getPlayerFormMap|features\/player-form/);
  }
  for (const file of [
    '../teams/server/services/team-roster.service.ts',
    '../players/server/services/player-catalogue-facts.service.ts',
    '../players/server/services/player-form.service.ts',
  ]) {
    expect(read(file)).toContain("from '@/features/player-form/server'");
    expect(read(file)).not.toMatch(/pgClient|\.query\(/);
  }
});
