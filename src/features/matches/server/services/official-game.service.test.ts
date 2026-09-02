import { beforeEach, describe, expect, it, vi } from 'vitest';

const queries = vi.hoisted(() => ({
  getOfficialPlayByPlay: vi.fn(),
  getOfficialShots: vi.fn(),
}));

vi.mock('../queries/official-game.query', () => queries);

import {
  getOfficialPlayByPlayData,
  getOfficialShotData,
  MatchesInputError,
} from './official-game.service';

describe('official game service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normalizes HTTP input and owns live/finalized cache policy', async () => {
    queries.getOfficialPlayByPlay.mockResolvedValue({ finalizedAt: null, items: [] });
    queries.getOfficialShots.mockResolvedValue({
      finalizedAt: '2026-09-02T10:00:00.000Z',
      items: [],
    });

    await expect(
      getOfficialPlayByPlayData({
        matchId: '42',
        filters: { period: '2', playerId: '7', teamCode: ' mad ' },
      })
    ).resolves.toMatchObject({ cacheSeconds: 15 });
    expect(queries.getOfficialPlayByPlay).toHaveBeenCalledWith(42, {
      period: 2,
      playerId: 7,
      teamCode: 'MAD',
    });

    await expect(getOfficialShotData({ matchId: '42', filters: {} })).resolves.toMatchObject({
      cacheSeconds: 3600,
    });
  });

  it('rejects invalid boundary input before querying the database', async () => {
    await expect(
      getOfficialShotData({ matchId: 'invalid', filters: {} })
    ).rejects.toBeInstanceOf(MatchesInputError);
    expect(queries.getOfficialShots).not.toHaveBeenCalled();
  });
});
