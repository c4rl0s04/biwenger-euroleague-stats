import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../queries/player.query', () => ({
  getAllPlayers: vi.fn(),
  getPlayerStreaks: vi.fn(),
  getPlayersBirthday: vi.fn(),
  getRisingStars: vi.fn(),
  getStatLeaders: vi.fn(),
  getTopPlayers: vi.fn(),
  getTopPlayersByForm: vi.fn(),
}));

import {
  createPlayerCatalogueService,
  PLAYERS_ACCESS_POLICY,
  PLAYERS_HTTP_CACHE_SECONDS,
} from './player-catalogue.service';

const player = {
  id: 7,
  name: 'Player',
  img: '',
  position: 'Base',
  price: 10,
  team_id: 2,
  team_name: 'Madrid',
  owner_id: 3,
  owner_name: 'Manager',
  owner_color_index: 1,
  points: 20,
  average: 4,
};

describe('player catalogue service', () => {
  const listPlayers = vi.fn();
  const listTopPlayers = vi.fn();
  const listStreaks = vi.fn();
  const service = createPlayerCatalogueService({ listPlayers, listTopPlayers, listStreaks });

  beforeEach(() => {
    vi.clearAllMocks();
    listPlayers.mockResolvedValue([player]);
    listTopPlayers.mockResolvedValue([player]);
    listStreaks.mockResolvedValue({ hot: [], cold: [] });
  });

  it('declares the existing page/API access and five-minute cache policies', () => {
    expect(PLAYERS_HTTP_CACHE_SECONDS).toBe(300);
    expect(PLAYERS_ACCESS_POLICY).toEqual({
      catalogue: 'authenticated-page',
      profile: 'authenticated-page-public-api',
      userReads: 'session-or-valid-user-id',
      mutations: 'none',
    });
  });

  it('maps the catalogue and orchestrates insights without duplicate contracts', async () => {
    await expect(service.getPlayerCatalogueData()).resolves.toMatchObject([{ id: 7 }]);
    await expect(service.getPlayerCatalogueInsightsData()).resolves.toMatchObject({
      topPerformers: [{ id: 7 }],
      streaks: { hot: [], cold: [] },
    });
    expect(listTopPlayers).toHaveBeenCalledWith(20);
    expect(listStreaks).toHaveBeenCalledWith(3);
  });
});
