import { cache } from 'react';

import type {
  PlayerCatalogueInsightsViewModel,
  PlayerCatalogueItemViewModel,
  PlayerStreaksViewModel,
} from '../../models/player-catalogue';
import {
  mapPlayerBirthdays,
  mapPlayerCatalogue,
  mapPlayerRecentFormRows,
  mapPlayerRisingStars,
  mapPlayerStatLeaders,
  mapPlayerStreaks,
  mapPlayerTopPerformers,
} from '../mappers/player.mapper';
import {
  getAllPlayers,
  getPlayerStreaks,
  getPlayersBirthday,
  getRisingStars,
  getStatLeaders,
  getTopPlayers,
  getTopPlayersByForm,
} from '../queries/player.query';

export const PLAYERS_HTTP_CACHE_SECONDS = 300;
export const PLAYERS_ACCESS_POLICY = Object.freeze({
  catalogue: 'authenticated-page',
  profile: 'authenticated-page-public-api',
  userReads: 'session-or-valid-user-id',
  mutations: 'none',
} as const);

export interface PlayerCatalogueServiceDependencies {
  listPlayers(): ReturnType<typeof getAllPlayers>;
  listTopPlayers(limit: number): ReturnType<typeof getTopPlayers>;
  listStreaks(minGames?: number): ReturnType<typeof getPlayerStreaks>;
}

export function createPlayerCatalogueService(dependencies: PlayerCatalogueServiceDependencies) {
  async function getPlayerCatalogueData(): Promise<PlayerCatalogueItemViewModel[]> {
    return mapPlayerCatalogue(await dependencies.listPlayers());
  }

  async function getPlayerCatalogueInsightsData(): Promise<PlayerCatalogueInsightsViewModel> {
    const [topRows, streakRows] = await Promise.all([
      dependencies.listTopPlayers(20),
      dependencies.listStreaks(3),
    ]);
    return {
      topPerformers: mapPlayerTopPerformers(topRows),
      streaks: mapPlayerStreaks(streakRows),
    };
  }

  async function getPlayerStreaksData(minGames?: number): Promise<PlayerStreaksViewModel> {
    return mapPlayerStreaks(await dependencies.listStreaks(minGames));
  }

  return { getPlayerCatalogueData, getPlayerCatalogueInsightsData, getPlayerStreaksData };
}

const playerCatalogueService = createPlayerCatalogueService({
  listPlayers: getAllPlayers,
  listTopPlayers: getTopPlayers,
  listStreaks: getPlayerStreaks,
});

// Pages remain force-dynamic; React cache only deduplicates reads per request.
export const getPlayerCatalogueData = cache(playerCatalogueService.getPlayerCatalogueData);
export const getPlayerCatalogueInsightsData = cache(
  playerCatalogueService.getPlayerCatalogueInsightsData
);
export const getPlayerStreaksData = cache(playerCatalogueService.getPlayerStreaksData);

// Deliberate mapped server contracts for existing Dashboard and stats consumers.
export async function getDashboardTopPlayers(limit = 6) {
  return mapPlayerTopPerformers(await getTopPlayers(limit));
}

export async function getDashboardTopPlayersByForm(limit = 5, rounds = 3) {
  return mapPlayerRecentFormRows(await getTopPlayersByForm(limit, rounds));
}

export async function getDashboardRisingStars(limit = 5) {
  return mapPlayerRisingStars(await getRisingStars(limit));
}

export async function getDashboardPlayerBirthdays() {
  return mapPlayerBirthdays(await getPlayersBirthday());
}

export async function getPlayerStatLeaders(type = 'points') {
  return mapPlayerStatLeaders(await getStatLeaders(type));
}
