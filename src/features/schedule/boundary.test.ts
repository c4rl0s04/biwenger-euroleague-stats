import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';

it('keeps the frozen lineup command unchanged until Task 15', () => {
  const files = [
    [
      'src/components/schedule/AutoAlignButton.js',
      'cc4a8fde140cacd35c70a70b74ec008db9f79ff879ec5fc757ef3848a810e636',
    ],
    [
      'src/components/schedule/LineupModal.js',
      '8d1945bbf45be9fd75d174d63951666d460ee66cbbd042cb98cd3a1943558d20',
    ],
    ['src/lib/api-client.js', 'd2be007a7e0b67e442311b8a575367ef42214e7aaf333ef075d836516cf726c3'],
    [
      'src/app/api/users/lineup/route.ts',
      '2a81d6ee0d54b9020d4589d10d9c7505a53e9543a25c35a22c1ba2676d287a1b',
    ],
  ];
  for (const [file, hash] of files)
    expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(hash);
});
it('registers both pages and retires the old persistence implementation', () => {
  const policy = JSON.parse(readFileSync('scripts/architecture/policy.json', 'utf8'));
  expect(policy.entrypoints).toContain('src/app/(app)/schedule/page.tsx');
  expect(policy.entrypoints).toContain('src/app/(app)/schedule/map/page.tsx');
  expect(existsSync('src/lib/db/queries/competition/schedule.ts')).toBe(false);
  const bridge = readFileSync('src/lib/services/app/scheduleService.ts', 'utf8');
  expect(bridge).toContain('@/features/schedule/server');
  expect(bridge).not.toMatch(/drizzle|lib\/db|fetch\(/);
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
