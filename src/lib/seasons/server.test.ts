import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const deps = vi.hoisted(() => ({ list: vi.fn(), active: vi.fn(), selected: vi.fn() }));
vi.mock('@/lib/seasons', () => ({
  listAvailableSeasons: deps.list,
  getActiveSeasonId: deps.active,
}));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: deps.selected }));
import { getRequestSeasonContext } from './server';

beforeEach(() => {
  vi.resetAllMocks();
  deps.selected.mockResolvedValue('selected');
  deps.active.mockResolvedValue('live');
  deps.list.mockResolvedValue([]);
});
it('preserves selection, ordering and nulls while allowlisting serializable season fields', async () => {
  const season = {
    id: 'old',
    name: 'Old',
    status: 'frozen',
    isSyncEnabled: false,
    euroleagueCode: null,
    startsAt: null,
    endsAt: null,
    frozenAt: new Date('2026-01-01T00:00:00Z'),
    secret: 'excluded',
  };
  deps.list.mockResolvedValue([season, { ...season, id: 'older', frozenAt: null }]);
  const result = await getRequestSeasonContext();
  expect(result.currentSeasonId).toBe('selected');
  expect(result.activeSeasonId).toBe('live');
  expect(result.seasons.map((item) => item.id)).toEqual(['old', 'older']);
  expect(result.seasons[0]).toEqual({
    id: 'old',
    name: 'Old',
    status: 'frozen',
    isSyncEnabled: false,
    euroleagueCode: null,
    startsAt: null,
    endsAt: null,
    frozenAt: '2026-01-01T00:00:00.000Z',
  });
  expect(result.seasons[1].frozenAt).toBeNull();
  expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  expect(JSON.stringify(result)).not.toContain('excluded');
});
it('only falls back for the active-season failure', async () => {
  deps.active.mockRejectedValue(new Error('no active season'));
  expect(await getRequestSeasonContext()).toEqual({
    seasons: [],
    currentSeasonId: 'selected',
    activeSeasonId: 'selected',
  });
  deps.list.mockRejectedValue(new Error('list failure'));
  await expect(getRequestSeasonContext()).rejects.toThrow('list failure');
  deps.list.mockResolvedValue([]);
  deps.selected.mockRejectedValue(new Error('selection failure'));
  await expect(getRequestSeasonContext()).rejects.toThrow('selection failure');
});
