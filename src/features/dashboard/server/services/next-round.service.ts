import 'server-only';
import { getRoundCalendar, resolveRoundIdByPolicy } from '@/features/rounds/server';
import { getRoundDetails } from '@/features/matches/server';
import { getDashboardTopPlayersByForm } from '@/features/players/server';
import { getManagerCaptainRecommendations } from '@/features/managers/server';
import { getMarketOpportunities } from '@/features/market/server';
import { mapDashboardCalendarRound } from '../mappers/dashboard.mapper';
import type { NextRoundDashboard } from '../../models/dashboard';

export const DASHBOARD_NEXT_ROUND_POLICY = {
  access: 'public-statistics-with-optional-caller-manager',
  serverCache: 'none',
  publicHttpSeconds: 60,
  personalizedHttp: 'private-no-store',
} as const;
export function createNextRoundDashboardService(deps: {
  select: typeof resolveRoundIdByPolicy;
  calendar: typeof getRoundCalendar;
  details: typeof getRoundDetails;
  form: typeof getDashboardTopPlayersByForm;
  captains: typeof getManagerCaptainRecommendations;
  market: typeof getMarketOpportunities;
}) {
  return {
    async fetchNextRound() {
      const targetId = await deps.select('active_or_next');
      return targetId ? deps.details(targetId) : null;
    },
    async getNextRoundData(userId: string | number | null = null): Promise<NextRoundDashboard> {
      const targetId = await deps.select('active_or_next');
      const [state, topPlayersForm, captainRecommendations, marketOpportunities, nextRound] =
        await Promise.all([
          deps.calendar(),
          deps.form(6, 3),
          userId ? deps.captains(userId, 6) : [],
          deps.market(6),
          targetId ? deps.details(targetId) : null,
        ]);
      return {
        nextRound,
        currentRoundStatus: mapDashboardCalendarRound(state.currentRound),
        topPlayersForm,
        captainRecommendations,
        marketOpportunities,
      };
    },
  };
}
export const { fetchNextRound, getNextRoundData } = createNextRoundDashboardService({
  select: resolveRoundIdByPolicy,
  calendar: getRoundCalendar,
  details: getRoundDetails,
  form: getDashboardTopPlayersByForm,
  captains: getManagerCaptainRecommendations,
  market: getMarketOpportunities,
});
