import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const fake = vi.hoisted(() => ({ query: vi.fn(), season: vi.fn() }));
vi.mock('@/lib/db/client', () => ({ db: { query: fake.query } }));
vi.mock('@/lib/db/connection', () => ({ pgClient: { query: fake.query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: fake.season }));
import { findTeamProfileDetails } from './services/team-profile-details.service';

const row = { id: 7, name: 'Fixture Team' };
beforeEach(() => {
  vi.resetAllMocks();
  fake.season.mockResolvedValue('fixture-season');
  fake.query.mockImplementation(async (sql: string) => {
    if (sql.includes('WITH TeamMatchStats')) return { rows: [row] };
    if (sql.includes('WITH TeamStats')) return { rows: [{ team_id: '7', rank: '3' }] };
    if (sql.includes('SELECT COUNT(DISTINCT')) return { rows: [{ count: '4' }] };
    if (sql.includes('RankedStandings'))
      return { rows: [{ team_id: '7', wins: '10', position: '10' }] };
    return { rows: [] };
  });
});

it('preserves Team Profile fact assembly and query ordering', async () => {
  expect(await findTeamProfileDetails(7)).toEqual({
    row,
    matchesPlayed: 4,
    playoffProbability: 45,
    rank: '3',
  });
  expect(fake.season).toHaveBeenCalledTimes(3);
  const fragments = [
    'WITH TeamMatchStats',
    'WITH TeamStats',
    'SELECT COUNT(DISTINCT',
    'RankedStandings',
    'recent_wins',
    'opponent_id',
  ];
  expect(fake.query).toHaveBeenCalledTimes(6);
  fragments.forEach((fragment, i) => expect(fake.query.mock.calls[i][0]).toContain(fragment));
});

it('keeps the existing missing-team null and complete read behavior', async () => {
  fake.query.mockResolvedValue({ rows: [] });
  expect(await findTeamProfileDetails(999)).toBeNull();
  expect(fake.query).toHaveBeenCalledTimes(6);
});
