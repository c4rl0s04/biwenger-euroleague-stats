import 'server-only';

import {
  queryHomeActivityRows,
  type HomeActivityRow,
} from '@/lib/db/queries/features/home-feed';
import { queryHomeSeasonMetadata } from '@/lib/db/queries/features/home-summary';
import { getCurrentRoundState } from '@/lib/db/queries/competition/rounds';
import { getPersonalizedAlerts } from '@/lib/db/queries/core/users';
import { decodeHomeFeedCursor, encodeHomeFeedCursor } from '@/lib/home/cursor';
import {
  HOME_FEED_PAGE_SIZE,
  type HomeActivityEvent,
  type HomeFeedPage,
  type HomeSummary,
} from '@/lib/home/contracts';
import { getAppStandings } from './appShellService';

const asNumber = (value: unknown) => Number(value ?? 0);
const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.length > 0 ? value : fallback;
const nullableString = (value: unknown) =>
  typeof value === 'string' && value.length > 0 ? value : null;

function normalizeActivityRow(row: HomeActivityRow): HomeActivityEvent {
  const payload = row.payload;
  const occurredAt = new Date(row.occurred_at).toISOString();

  if (row.type === 'transfer') {
    return {
      id: row.id,
      type: 'transfer',
      occurredAt,
      player: {
        id: asNumber(payload.playerId),
        name: asString(payload.playerName, 'Jugador'),
        position: nullableString(payload.position),
        image: nullableString(payload.playerImage),
        teamCode: nullableString(payload.teamCode),
      },
      seller: {
        id: nullableString(payload.sellerId),
        name: asString(payload.sellerName, 'Mercado'),
      },
      buyer: {
        id: nullableString(payload.buyerId),
        name: asString(payload.buyerName, 'Mercado'),
      },
      amount: asNumber(payload.amount),
    };
  }

  if (row.type === 'round_completed') {
    const participants = Array.isArray(payload.participants) ? payload.participants : [];

    return {
      id: row.id,
      type: 'round_completed',
      occurredAt,
      roundId: asNumber(payload.roundId),
      roundName: asString(payload.roundName, 'Jornada'),
      totalBonus: asNumber(payload.totalBonus),
      participants: participants.map((participant) => {
        const item = participant as Record<string, unknown>;
        return {
          userId: asString(item.userId),
          name: asString(item.name, 'Manager'),
          icon: nullableString(item.icon),
          colorIndex: asNumber(item.colorIndex),
          position: asNumber(item.position),
          points: asNumber(item.points),
          bonus: asNumber(item.bonus),
        };
      }),
    };
  }

  if (row.type === 'admin_bonus') {
    return {
      id: row.id,
      type: 'admin_bonus',
      occurredAt,
      recipient: {
        id: asString(payload.recipientId),
        name: asString(payload.recipientName, 'Manager'),
        icon: nullableString(payload.icon),
        colorIndex: asNumber(payload.colorIndex),
      },
      amount: asNumber(payload.amount),
      description: asString(payload.description, 'Prima administrativa'),
    };
  }

  const matches = Array.isArray(payload.matches) ? payload.matches : [];
  return {
    id: row.id,
    type: 'match_session',
    occurredAt,
    roundId: asNumber(payload.roundId),
    roundName: asString(payload.roundName, 'Jornada'),
    sessionDate: asString(payload.sessionDate),
    matches: matches.map((match) => {
      const item = match as Record<string, unknown>;
      return {
        id: asNumber(item.id),
        home: {
          id: asNumber(item.homeId),
          name: asString(item.homeName, 'Local'),
          code: nullableString(item.homeCode),
          image: nullableString(item.homeImage),
          score: asNumber(item.homeScore),
        },
        away: {
          id: asNumber(item.awayId),
          name: asString(item.awayName, 'Visitante'),
          code: nullableString(item.awayCode),
          image: nullableString(item.awayImage),
          score: asNumber(item.awayScore),
        },
      };
    }),
  };
}

export async function getHomeFeedPage(cursorValue?: string | null): Promise<HomeFeedPage> {
  const cursor = cursorValue ? decodeHomeFeedCursor(cursorValue) : null;
  const rows = await queryHomeActivityRows({
    cursor,
    limit: HOME_FEED_PAGE_SIZE + 1,
  });
  const pageRows = rows.slice(0, HOME_FEED_PAGE_SIZE);
  const hasMore = rows.length > HOME_FEED_PAGE_SIZE;
  const boundary = pageRows.at(-1);

  return {
    items: pageRows.map(normalizeActivityRow),
    hasMore,
    nextCursor:
      hasMore && boundary
        ? encodeHomeFeedCursor({
            occurredAt: new Date(boundary.occurred_at).toISOString(),
            id: boundary.id,
          })
        : null,
  };
}

export async function getHomeSummary(userId: string): Promise<HomeSummary> {
  const [season, standings, roundState, alerts] = await Promise.all([
    queryHomeSeasonMetadata(),
    getAppStandings(),
    getCurrentRoundState(),
    getPersonalizedAlerts(userId, 3).catch(() => []),
  ]);

  const user = standings.find((item) => String(item.user_id) === String(userId));
  const activeRound = roundState.currentRound ?? roundState.nextRound;
  const normalizedStatus = activeRound?.status_calc;
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
      id: activeRound?.round_id == null ? null : Number(activeRound.round_id),
      name: nullableString(activeRound?.round_name),
      status:
        normalizedStatus === 'live' ||
        normalizedStatus === 'finished' ||
        normalizedStatus === 'upcoming'
          ? normalizedStatus
          : 'unavailable',
      startsAt: activeRound?.start_date
        ? new Date(activeRound.start_date).toISOString()
        : null,
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
        alert.severity === 'success' ||
        alert.severity === 'warning' ||
        alert.severity === 'error'
          ? alert.severity
          : 'info',
    })),
  };
}
