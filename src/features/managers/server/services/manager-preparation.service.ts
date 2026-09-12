import 'server-only';
import { getPlayerFormStats } from '@/features/players/server';
import {
  resolveManagerPreparationSeason,
  readCaptainCandidates,
  readManagerAlerts,
} from '../queries/manager-preparation.query';
import { mapCaptainRecommendations, mapManagerAlerts } from '../mappers/manager-preparation.mapper';

export const MANAGER_PREPARATION_POLICY = Object.freeze({
  identity: 'caller-resolved manager; edge validation retained',
  serverCache: 'none',
  httpCache: 'private/no-store for identity-derived HTTP responses',
  mutations: 'none',
} as const);

export function createManagerPreparationService(
  deps = {
    season: resolveManagerPreparationSeason,
    candidates: readCaptainCandidates,
    form: getPlayerFormStats,
    alerts: readManagerAlerts,
  }
) {
  return {
    async getManagerCaptainRecommendations(userId: string | number, limit = 3) {
      // Preserve original order: resolve owner season, then start squad and form together.
      const seasonId = await deps.season();
      const [rows, form] = await Promise.all([deps.candidates(userId, seasonId), deps.form(3)]);
      return mapCaptainRecommendations(rows, form, limit);
    },
    async getManagerPersonalizedAlerts(userId: string | number, limit = 5) {
      return mapManagerAlerts(await deps.alerts(userId), limit);
    },
  };
}

export const { getManagerCaptainRecommendations, getManagerPersonalizedAlerts } =
  createManagerPreparationService();
