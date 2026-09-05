import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/services/core/userService', () => ({
  fetchUserRecentRounds: vi.fn(),
  fetchUserSeasonStats: vi.fn(),
  fetchUserSquadDetails: vi.fn(),
}));

import {
  fetchUserRecentRounds,
  fetchUserSeasonStats,
  fetchUserSquadDetails,
} from '@/lib/services/core/userService';

import {
  getPlayerUserRoundsData,
  getPlayerUserSeasonStatsData,
  getPlayerUserSquadData,
} from './player-user-read.service';

describe('player user-read adapter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('preserves the existing user stats, rounds and Lineup squad contracts', async () => {
    const stats = { id: '42', last_transfers: [] };
    const rounds = { rounds: [], total_played: 0, total_rounds: 0 };
    const squad = { players: [], top_rising: [], top_falling: [] };
    vi.mocked(fetchUserSeasonStats).mockResolvedValue(
      stats as unknown as Awaited<ReturnType<typeof fetchUserSeasonStats>>
    );
    vi.mocked(fetchUserRecentRounds).mockResolvedValue(rounds);
    vi.mocked(fetchUserSquadDetails).mockResolvedValue(
      squad as unknown as Awaited<ReturnType<typeof fetchUserSquadDetails>>
    );

    await expect(getPlayerUserSeasonStatsData('42')).resolves.toBe(stats);
    await expect(getPlayerUserRoundsData('42')).resolves.toBe(rounds);
    await expect(getPlayerUserSquadData('42')).resolves.toBe(squad);
    expect(fetchUserSeasonStats).toHaveBeenCalledWith('42');
    expect(fetchUserRecentRounds).toHaveBeenCalledWith('42');
    expect(fetchUserSquadDetails).toHaveBeenCalledWith('42');
  });
});
