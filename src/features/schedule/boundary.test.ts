import { readFileSync, existsSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';

it('preserves the legacy auto-lineup POST while allowing an optional conflict baseline', async () => {
  const fetchMock = vi.fn(async () =>
    Response.json({ success: true, data: { status: 'completed' } })
  );
  vi.stubGlobal('fetch', fetchMock);
  try {
    const lineup = { type: '2-2-1', playersID: [1, 2, 3, 4, 5], reservesID: [], captain: 1 };
    await expect(apiClient.saveLineup(lineup)).resolves.toMatchObject({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenLastCalledWith('/api/users/lineup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineup }),
    });
    await apiClient.saveLineup(lineup, 'saved-baseline');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith('/api/users/lineup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lineup, baseline: 'saved-baseline' }),
    });
  } finally {
    vi.unstubAllGlobals();
  }
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
  const source = readFileSync('src/features/lineup/components/AutoAlignButton.js', 'utf8');
  expect(source).toContain("import { buildAutoLineup } from '../logic/auto-lineup'");
  expect(source).toContain('apiClient.saveLineup(lineupPayload)');
  expect(source).not.toContain('posCount');
});
