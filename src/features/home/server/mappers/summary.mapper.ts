import 'server-only';
import type { HomeSummary } from '../../models/contracts';
import type { HomeSeasonMetadata } from '../queries/home-summary.query';
import type { FullStandingsEntry } from '@/features/standings/public';
import type { RoundCalendar } from '@/features/rounds/public';
import type { getManagerPersonalizedAlerts } from '@/features/managers/server';
const asNumber = (value: unknown) => Number(value ?? 0);
const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.length > 0 ? value : fallback;
const nullableString = (value: unknown) =>
  typeof value === 'string' && value.length > 0 ? value : null;

export function mapHomeSummary(
  userId: string,
  season: HomeSeasonMetadata,
  standings: FullStandingsEntry[],
  roundState: RoundCalendar,
  alerts: Awaited<ReturnType<typeof getManagerPersonalizedAlerts>>
): HomeSummary {
  const user = standings.find((item) => String(item.user_id) === String(userId));
  const activeRound = roundState.currentRound ?? roundState.nextRound;
  const normalizedStatus = activeRound?.status;
  const phase =
    season.status === 'frozen' || season.status === 'finished'
      ? 'finished'
      : season.completedRounds > 0
        ? 'active'
        : 'preseason';

  return {
    seasonId: season.id,
    seasonName: season.name,
    phase,
    user: {
      id: userId,
      name: asString(user?.name, 'Manager'),
      position: Number(user?.rounds_played ?? 0) > 0 ? asNumber(user?.position) : null,
      totalPoints: asNumber(user?.total_points),
      teamValue: asNumber(user?.team_value),
      priceTrend: asNumber(user?.price_trend),
    },
    round: {
      id: activeRound?.roundId == null ? null : Number(activeRound.roundId),
      name: nullableString(activeRound?.roundName),
      status:
        normalizedStatus === 'live' ||
        normalizedStatus === 'finished' ||
        normalizedStatus === 'upcoming'
          ? normalizedStatus
          : 'unavailable',
      startsAt: activeRound?.startDate ? new Date(activeRound.startDate).toISOString() : null,
    },
    alerts: alerts.map((alert) => ({
      type:
        alert.type === 'price_gain' ||
        alert.type === 'price_loss' ||
        alert.type === 'good_performance'
          ? alert.type
          : 'info',
      message: alert.message,
      severity:
        alert.severity === 'success' || alert.severity === 'warning' || alert.severity === 'error'
          ? alert.severity
          : 'info',
    })),
  };
}
