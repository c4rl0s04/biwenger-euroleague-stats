import 'server-only';
import { getPlayerFormStats } from '@/features/players/server';
import type {
  ManagerCaptainRecommendation,
  ManagerPersonalizedAlert,
} from '../../models/manager-preparation';
import { mapCaptainRecommendations, mapManagerAlerts } from '../mappers/manager-preparation.mapper';
import {
  readCaptainCandidates,
  readManagerAlertsRaw,
  resolveManagerPreparationSeason,
} from '../queries/manager-preparation.query';

export const MANAGER_PREPARATION_POLICY = Object.freeze({
  identity: 'caller-resolved; HTTP query then session validation remains at the edge',
  httpCache: 'private, no-store, max-age=0, must-revalidate',
  serverCache: 'none',
  captainFormRounds: 3,
  defaultCaptainLimit: 3,
  defaultAlertsLimit: 5,
  mutations: 'none',
} as const);

export function createManagerPreparationService(
  deps = {
    resolveSeason: resolveManagerPreparationSeason,
    candidates: readCaptainCandidates,
    playerForm: getPlayerFormStats,
    alertsRaw: readManagerAlertsRaw,
  }
) {
  return {
    async getManagerCaptainRecommendations(
      userId: string | number,
      limit: number = MANAGER_PREPARATION_POLICY.defaultCaptainLimit
    ): Promise<ManagerCaptainRecommendation[]> {
      const seasonId = await deps.resolveSeason();
      const [candidates, formStats] = await Promise.all([
        deps.candidates(userId, seasonId),
        deps.playerForm(MANAGER_PREPARATION_POLICY.captainFormRounds),
      ]);
      return mapCaptainRecommendations(candidates, formStats, limit);
    },

    async getManagerPersonalizedAlerts(
      userId: string | number,
      limit: number = MANAGER_PREPARATION_POLICY.defaultAlertsLimit
    ): Promise<ManagerPersonalizedAlert[]> {
      const seasonId = await deps.resolveSeason();
      const rawData = await deps.alertsRaw(userId, seasonId);
      return mapManagerAlerts(rawData, limit);
    },
  };
}

export const { getManagerCaptainRecommendations, getManagerPersonalizedAlerts } =
  createManagerPreparationService();
