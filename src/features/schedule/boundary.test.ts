import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';

it('preserves the unchanged lineup preview and HTTP command adapter', () => {
  const files = [
    [
      'src/components/schedule/LineupModal.js',
      '8d1945bbf45be9fd75d174d63951666d460ee66cbbd042cb98cd3a1943558d20',
    ],
    ['src/lib/api-client.js', 'd2be007a7e0b67e442311b8a575367ef42214e7aaf333ef075d836516cf726c3'],
  ];
  for (const [file, hash] of files)
    expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(hash);
});
it('registers both pages and retires the old persistence implementation', () => {
  const policy = JSON.parse(readFileSync('scripts/architecture/policy.json', 'utf8'));
  expect(policy.entrypoints).toContain('src/app/(app)/schedule/page.tsx');
  expect(policy.entrypoints).toContain('src/app/(app)/schedule/map/page.tsx');
  expect(existsSync('src/lib/db/queries/competition/schedule.ts')).toBe(false);
  expect(existsSync('src/lib/services/app/scheduleService.ts')).toBe(false);
});
it('keeps explicit private freshness and client/server separation', () => {
  const server = readFileSync('src/features/schedule/server.ts', 'utf8');
  const publicSource = readFileSync('src/features/schedule/public.ts', 'utf8');
  expect(server).toMatch(/^import 'server-only'/);
  expect(publicSource).not.toMatch(/server\/|lib\/db/);
  for (const path of [
    'src/features/schedule/server/services/schedule.service.ts',
    'src/features/schedule/models/schedule.ts',
    'src/features/schedule/components/MobileScheduleScreen.tsx',
  ]) {
    expect(readFileSync(path, 'utf8')).not.toMatch(/\bany\b|unstable_cache|['"]use cache['"]/);
  }
});

it('delegates automatic selection to Lineup while retaining the existing command endpoint', () => {
  // Whole-file freezing no longer applies to this intentionally extracted domain algorithm.
  // Payload, selection, ordering and errors are covered by Lineup logic tests.
  const source = readFileSync('src/components/schedule/AutoAlignButton.js', 'utf8');
  expect(source).toContain("import { buildAutoLineup } from '@/features/lineup/public'");
  expect(source).toContain('apiClient.saveLineup(lineupPayload)');
  expect(source).not.toContain('posCount');
});
