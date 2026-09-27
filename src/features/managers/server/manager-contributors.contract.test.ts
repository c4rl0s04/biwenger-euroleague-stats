import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ pgClient: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
vi.mock('@/features/managers/server', async () => {
  return await import('./services/manager-contributors.service');
});
import { getManagerContributorsData } from './services/manager-contributors.service';

beforeEach(() => {
  vi.clearAllMocks();
  fake.season.mockResolvedValue('2026-27');
  fake.query.mockResolvedValue({
    rows: [
      {
        player_id: 3,
        player_name: null,
        player_img: null,
        total_base_points: '8',
        total_contribution: '16',
        games_played: '1',
        credential: 'excluded',
      },
    ],
  });
});
describe('contributor feature contract', () => {
  it('returns allowlisted models while preserving text identities', async () => {
    const expected = [
      {
        player_id: 3,
        player_name: null,
        player_img: null,
        total_base_points: 8,
        total_contribution: 16,
        games_played: 1,
      },
    ];
    expect(await getManagerContributorsData('007')).toEqual(expected);
    expect(await getManagerContributorsData('007')).toEqual(expected);
    expect(await getManagerContributorsData('7')).toEqual(expected);
    expect(fake.query.mock.calls.map((call) => call[1])).toEqual([
      ['007', '2026-27'],
      ['007', '2026-27'],
      ['7', '2026-27'],
    ]);
  });
  it('publishes independent types, keeps SQL inside its query and exposes its owned contract', () => {
    const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
    expect(source('../models/manager-contributors.ts')).not.toMatch(/\bany\b|lib\/db|queries/);
    expect(source('./services/manager-contributors.service.ts')).not.toContain('@/lib/db');
    expect(source('../public.ts')).toContain('ManagerContributorViewModel');
    expect(source('../server.ts')).toContain('getManagerContributorsData');
  });
});
