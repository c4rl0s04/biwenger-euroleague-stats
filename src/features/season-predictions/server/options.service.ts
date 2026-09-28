import 'server-only';

import { getManagerDirectory } from '@/features/managers/server';
import { getPlayerCatalogueData } from '@/features/players/server';
import {
  mapManagerOptions,
  mapPlayerOptions,
  type SeasonPredictionOptions,
} from '../models/options';

export const SEASON_PREDICTIONS_READ_POLICY = Object.freeze({
  access: 'authenticated app page',
  freshness: 'resolve selected season on each request through existing domain services',
  mutations: 'none',
} as const);

export async function getSeasonPredictionOptions(): Promise<SeasonPredictionOptions> {
  const [players, managers] = await Promise.all([getPlayerCatalogueData(), getManagerDirectory()]);
  return { players: mapPlayerOptions(players), managers: mapManagerOptions(managers) };
}
