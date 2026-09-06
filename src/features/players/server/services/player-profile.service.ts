import 'server-only';

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
import {
  mapPlayerPerformanceSummary,
  mapPlayerProfile,
  toPlayerProfileApiModel,
} from '../mappers/player.mapper';
import { getPlayerDetails, type PlayerDetailsQueryResult } from '../queries/player.query';

export interface PlayerProfileServiceDependencies {
  findPlayer(playerId: number): Promise<PlayerDetailsQueryResult | null>;
  getTeamMetrics(teamId: number): ReturnType<typeof getTeamProfileMetricsData>;
  getUpcomingMatches(teamId: number): ReturnType<typeof getTeamProfileUpcomingMatchesData>;
}

export function createPlayerProfileService(dependencies: PlayerProfileServiceDependencies) {
  async function readPlayerProfile(playerIdInput: unknown) {
    const playerId = parsePlayerId(playerIdInput);
    if (playerId == null) return null;

    const result = await dependencies.findPlayer(playerId);
    if (!result) return null;

    const [teamMetrics, upcomingMatches] = await Promise.all([
      dependencies.getTeamMetrics(Number(result.player.team_id)),
      dependencies.getUpcomingMatches(Number(result.player.team_id)),
    ]);
    return { result, model: mapPlayerProfile(result, teamMetrics, upcomingMatches) };
  }

  async function getPlayerProfileData(
    playerIdInput: unknown
  ): Promise<PlayerProfileViewModel | null> {
    return (await readPlayerProfile(playerIdInput))?.model ?? null;
  }

  async function getPlayerProfileApiData(playerIdInput: unknown) {
    const read = await readPlayerProfile(playerIdInput);
    return read ? toPlayerProfileApiModel(read.model, read.result) : null;
  }

  async function getPlayerPerformanceSummaryData(
    playerIdInput: unknown
  ): Promise<PlayerPerformanceSummaryViewModel | null> {
    const player = await getPlayerProfileData(playerIdInput);
    return player ? mapPlayerPerformanceSummary(player) : null;
  }

  return { getPlayerProfileData, getPlayerProfileApiData, getPlayerPerformanceSummaryData };
}

const playerProfileService = createPlayerProfileService({
  findPlayer: getPlayerDetails,
  getTeamMetrics: getTeamProfileMetricsData,
  getUpcomingMatches: getTeamProfileUpcomingMatchesData,
});

export const getPlayerProfileData = cache(playerProfileService.getPlayerProfileData);
export const getPlayerProfileApiData = cache(playerProfileService.getPlayerProfileApiData);
export const getPlayerPerformanceSummaryData = cache(
  playerProfileService.getPlayerPerformanceSummaryData
);

export const getPlayerPerformanceSummaryForProfile = mapPlayerPerformanceSummary;
