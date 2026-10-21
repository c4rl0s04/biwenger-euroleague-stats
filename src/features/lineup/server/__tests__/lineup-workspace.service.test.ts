import { beforeEach, expect, it, vi } from 'vitest';
import { executeUserProviderQuery } from '@/features/provider/server';
import { getPlayerRecentScores } from '@/features/players/server';
import { getLineupWorkspace } from '../services/lineup-workspace.service';
import { readWorkspacePlayers } from '../queries/workspace.query';
vi.mock('@/features/provider/server', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  executeUserProviderQuery: vi.fn(),
}));
vi.mock('@/features/players/server', () => ({ getPlayerRecentScores: vi.fn() }));
vi.mock('../queries/workspace.query', () => ({ readWorkspacePlayers: vi.fn() }));
const query = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  query.mockResolvedValue({
    data: {
      lineup: { type: '2-2-1', playersID: [1, null, 3], captain: { id: 1 } },
      players: [{ id: 1 }, { id: 3 }, { id: 9 }],
    },
    token: 'secret-canary',
  });
  vi.mocked(executeUserProviderQuery).mockImplementation(async (userId, _operation, run) =>
    run({ query } as never, { userId, token: 'secret-canary' })
  );
  vi.mocked(readWorkspacePlayers).mockResolvedValue([
    { id: 1, name: 'Owned', position: 'Base', img: '/official.png', price: '100' },
  ] as never);
  vi.mocked(getPlayerRecentScores).mockResolvedValue([
    { playerId: 1, recentScores: '10,9' },
  ] as never);
});
it('enriches only live-owned IDs, includes new purchases and marks missing local details', async () => {
  const result = await getLineupWorkspace('actor');
  expect(readWorkspacePlayers).toHaveBeenCalledWith(['1', '3', '9']);
  expect(result.players.map((p) => String(p.id))).toEqual(['1', '3', '9']);
  expect(result.players[0]).toMatchObject({
    img: '/official.png',
    price: 100,
    detailsAvailable: true,
  });
  expect(result.players[2].name).toContain('información pendiente');
  expect(result.players[2]).toMatchObject({ id: '9', detailsAvailable: false, position: null });
  expect(result.provider.lineup?.captain).toBe(1);
  expect(result.provider.lineup?.playersID).toEqual([1, null, 3]);
  expect(JSON.stringify(result)).not.toContain('secret-canary');
  expect(query).toHaveBeenCalledTimes(1);
});

it.each([
  { type: '2-2-1', playersID: [{}] },
  { type: '2-2-1', playersID: [1], reservesID: {} },
  { type: '2-2-1', playersID: [1], captain: {} },
])('rejects malformed saved slots before local enrichment', async (lineup) => {
  query.mockResolvedValue({ data: { lineup, players: [{ id: 1 }] } });
  await expect(getLineupWorkspace('actor')).rejects.toMatchObject({
    code: 'LINEUP_STATE_UNAVAILABLE',
  });
  expect(readWorkspacePlayers).not.toHaveBeenCalled();
});
