import { cache } from 'react';

import {
  getTeamProfileMetricsData,
  getTeamProfileUpcomingMatchesData,
} from '@/features/teams/server';

import type {
  PlayerPerformanceSummaryViewModel,
  PlayerProfileViewModel,
} from '../../models/player-profile';
import { parsePlayerId } from '../../validation/player-input';
import { mapPlayerPerformanceSummary, mapPlayerProfile } from '../mappers/player.mapper';
import { getPlayerDetails, type PlayerDetailsQueryResult } from '../queries/player.query';

export interface PlayerProfileServiceDependencies {
  findPlayer(playerId: number): Promise<PlayerDetailsQueryResult | null>;
  getTeamMetrics(teamId: number): ReturnType<typeof getTeamProfileMetricsData>;
  getUpcomingMatches(teamId: number): ReturnType<typeof getTeamProfileUpcomingMatchesData>;
}

export function createPlayerProfileService(dependencies: PlayerProfileServiceDependencies) {
  async function getPlayerProfileData(
    playerIdInput: unknown
  ): Promise<PlayerProfileViewModel | null> {
    const playerId = parsePlayerId(playerIdInput);
    if (playerId == null) return null;

    const result = await dependencies.findPlayer(playerId);
    if (!result) return null;

    const [teamMetrics, upcomingMatches] = await Promise.all([
      dependencies.getTeamMetrics(Number(result.player.team_id)),
      dependencies.getUpcomingMatches(Number(result.player.team_id)),
    ]);
    return mapPlayerProfile(result, teamMetrics, upcomingMatches);
  }

  async function getPlayerPerformanceSummaryData(
    playerIdInput: unknown
  ): Promise<PlayerPerformanceSummaryViewModel | null> {
    const player = await getPlayerProfileData(playerIdInput);
    return player ? mapPlayerPerformanceSummary(player) : null;
  }

  return { getPlayerProfileData, getPlayerPerformanceSummaryData };
}

const playerProfileService = createPlayerProfileService({
  findPlayer: getPlayerDetails,
  getTeamMetrics: getTeamProfileMetricsData,
  getUpcomingMatches: getTeamProfileUpcomingMatchesData,
});

export const getPlayerProfileData = cache(playerProfileService.getPlayerProfileData);
export const getPlayerPerformanceSummaryData = cache(
  playerProfileService.getPlayerPerformanceSummaryData
);

export const getPlayerPerformanceSummaryForProfile = mapPlayerPerformanceSummary;
