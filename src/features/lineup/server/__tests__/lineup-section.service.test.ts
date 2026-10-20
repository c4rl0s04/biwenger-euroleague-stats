import { beforeEach, expect, it, vi } from 'vitest';
const readSquad = vi.hoisted(() => vi.fn());
vi.mock('@/features/managers/server', () => ({ getManagerSquadData: readSquad }));
import { getLineupSectionData, LINEUP_SECTION_POLICY } from '../services/lineup-section.service';

beforeEach(() => {
  readSquad.mockReset();
});

it('preserves the empty session state without querying Managers', async () => {
  expect(await getLineupSectionData()).toEqual({
    playerCount: 0,
    totalValue: 0,
    risingCount: 0,
    fallingCount: 0,
    rows: [{ key: '0', title: 'Registro 1' }],
  });
  expect(readSquad).not.toHaveBeenCalled();
});

it('maps the caller-resolved squad to an allowlisted serializable screen model', async () => {
  readSquad.mockResolvedValue({
    player_count: 1,
    total_value: 250,
    top_rising: [{}],
    top_falling: [],
    players: [{ id: 0, name: '', team: null, position: 'Base', points: '0', price: 10 }],
    unrelated: 'discard',
  });
  const model = await getLineupSectionData('7');
  expect(readSquad).toHaveBeenCalledExactlyOnceWith('7');
  expect(model).toEqual({
    playerCount: 1,
    totalValue: 250,
    risingCount: 1,
    fallingCount: 0,
    rows: [{ key: '0', title: '', subtitle: 'Base', value: 0, href: '/player/0' }],
  });
  expect(JSON.parse(JSON.stringify(model))).toEqual(model);
  expect(LINEUP_SECTION_POLICY.cache).toBe('none');
});

it('propagates existing read failures', async () => {
  const failure = new Error('read unavailable');
  readSquad.mockRejectedValue(failure);
  await expect(getLineupSectionData('7')).rejects.toThrow('read unavailable');
});
