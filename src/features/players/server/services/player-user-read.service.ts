import {
  fetchUserRecentRounds,
  fetchUserSeasonStats,
  fetchUserSquadDetails,
} from '@/lib/services/core/userService';

import type {
  PlayerUserRoundsViewModel,
  PlayerUserSeasonStatsViewModel,
  PlayerUserSquadViewModel,
} from '../../models/player-user-reads';

export async function getPlayerUserSeasonStatsData(
  userId: string
): Promise<PlayerUserSeasonStatsViewModel> {
  return fetchUserSeasonStats(userId);
}

export async function getPlayerUserRoundsData(userId: string): Promise<PlayerUserRoundsViewModel> {
  return (await fetchUserRecentRounds(userId)) as PlayerUserRoundsViewModel;
}

export async function getPlayerUserSquadData(userId: string): Promise<PlayerUserSquadViewModel> {
  return fetchUserSquadDetails(userId);
}
