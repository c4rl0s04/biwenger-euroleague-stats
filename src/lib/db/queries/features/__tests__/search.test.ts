import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  resolveReadSeasonId: vi.fn(),
}));

vi.mock('../../../index', () => ({
  db: {},
  pgClient: {
    query: mocks.query,
  },
}));

vi.mock('../../../season-context', () => ({
  resolveReadSeasonId: mocks.resolveReadSeasonId,
}));

import { globalSearch } from '../search';

describe('globalSearch season isolation', () => {
  beforeEach(() => {
    mocks.query.mockReset();
    mocks.resolveReadSeasonId.mockReset();
    mocks.resolveReadSeasonId.mockResolvedValue('2026-27');
  });

  it('searches players, teams, and users inside the resolved season', async () => {
    mocks.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            name: 'Campazzo',
            img: 'img.png',
            position: 'Base',
            team: 'Real Madrid',
            price: '1000000',
            points: '25',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: 5, name: 'Real Madrid', player_count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'u1', name: 'Manager', icon: null }] });

    const result = await globalSearch('Campazzo');

    expect(result.players[0]).toMatchObject({ id: 1, price: 1000000, points: 25 });
    expect(result.teams[0]).toMatchObject({ id: 5, player_count: 1 });
    expect(result.users[0]).toMatchObject({ id: 'u1', name: 'Manager' });

    expect(mocks.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('JOIN player_seasons ps ON ps.player_id = p.id'),
      ['%Campazzo%', '2026-27', 5]
    );
    expect(mocks.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(
        'LEFT JOIN player_seasons ps ON ps.team_id = t.id AND ps.season_id = $2'
      ),
      ['%Campazzo%', '2026-27', 5]
    );
    expect(mocks.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM user_seasons us'),
      ['%Campazzo%', '2026-27', 5]
    );
  });
});
