import 'server-only';

import {
  queryHomeActivityRows,
  queryHomeRoundHighlightPlayers,
  type HomeActivityRow,
  type HomeRoundHighlightPlayerRow,
} from '@/lib/db/queries/features/home-feed';
import { queryHomeSeasonMetadata } from '@/lib/db/queries/features/home-summary';
import { getCurrentRoundState } from '@/lib/db/queries/competition/rounds';
import { getPersonalizedAlerts } from '@/lib/db/queries/core/users';
import { decodeHomeFeedCursor, encodeHomeFeedCursor } from '@/lib/home/cursor';
import {
  HOME_FEED_PAGE_SIZE,
  type HomeActivityFilter,
  type HomeActivityEvent,
  type HomeFeedPage,
  type HomeSummary,
} from '@/lib/home/contracts';
import { getAppStandings } from './appShellService';
import { selectIdealLineup } from '@/lib/logic/ideal-lineup';
import { parseTournamentWinner } from '@/lib/home/tournament-winner';

const asNumber = (value: unknown) => Number(value ?? 0);
const asString = (value: unknown, fallback = '') =>
  typeof value === 'string' && value.length > 0 ? value : fallback;
const nullableString = (value: unknown) =>
  typeof value === 'string' && value.length > 0 ? value : null;
const nullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function normalizeActivityRow(
  row: HomeActivityRow,
  highlightRows: HomeRoundHighlightPlayerRow[] = []
): HomeActivityEvent | null {
  const payload = row.payload;
  const occurredAt = new Date(row.occurred_at).toISOString();

  if (row.type === 'transfer_day') {
    const transfers = Array.isArray(payload.transfers) ? payload.transfers : [];

    return {
      id: row.id,
      type: 'transfer_day',
      occurredAt,
      date: asString(payload.date),
      transfers: transfers.map((transfer) => {
        const item = transfer as Record<string, unknown>;
        const sellerId = nullableString(item.sellerId);
        const buyerId = nullableString(item.buyerId);
        const itemOccurredAt = new Date(asString(item.occurredAt, occurredAt));

        return {
          id: asString(item.id),
          occurredAt: Number.isNaN(itemOccurredAt.getTime())
            ? occurredAt
            : itemOccurredAt.toISOString(),
          player: {
            id: asNumber(item.playerId),
            name: asString(item.playerName, 'Jugador'),
            position: nullableString(item.position),
            image: nullableString(item.playerImage),
            teamCode: nullableString(item.teamCode),
          },
          seller: {
            id: sellerId,
            name: asString(item.sellerName, 'Mercado'),
            icon: nullableString(item.sellerIcon),
            colorIndex: asNumber(item.sellerColorIndex),
            isMarket: sellerId === null,
          },
          buyer: {
            id: buyerId,
            name: asString(item.buyerName, 'Mercado'),
            icon: nullableString(item.buyerIcon),
            colorIndex: asNumber(item.buyerColorIndex),
            isMarket: buyerId === null,
          },
          amount: asNumber(item.amount),
          marketValue: nullableNumber(item.marketValue),
          marketValueAt: nullableString(item.marketValueAt),
        };
      }),
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

  if (row.type === 'prediction_round') {
    const participants = Array.isArray(payload.participants) ? payload.participants : [];
    const actualResults = Array.isArray(payload.actualResults) ? payload.actualResults : [];

    return {
      id: row.id,
      type: 'prediction_round',
      occurredAt,
      roundId: asNumber(payload.roundId),
      roundName: asString(payload.roundName, 'Jornada'),
      totalMatches: asNumber(payload.totalMatches),
      actualResults: actualResults.filter(
        (result): result is '1' | 'X' | '2' => result === '1' || result === 'X' || result === '2'
      ),
      participants: participants.map((participant) => {
        const item = participant as Record<string, unknown>;
        const participation = item.participation;
        const predictions = Array.isArray(item.predictions) ? item.predictions : [];
        return {
          userId: asString(item.userId),
          name: asString(item.name, 'Manager'),
          icon: nullableString(item.icon),
          colorIndex: asNumber(item.colorIndex),
          participation:
            participation === 'complete' || participation === 'partial' ? participation : 'absent',
          hits: asNumber(item.hits),
          position: nullableNumber(item.position),
          userMatches: asNumber(item.userMatches),
          predictions: predictions.map((prediction) =>
            prediction === '1' || prediction === 'X' || prediction === '2' ? prediction : null
          ),
        };
      }),
    };
  }

  if (row.type === 'round_highlight') {
    if (highlightRows.length < 10) return null;
    const candidates = highlightRows.map((player) => ({
      player_id: asNumber(player.player_id),
      name: asString(player.name, 'Jugador'),
      position: nullableString(player.position),
      img: nullableString(player.img),
      team_short: nullableString(player.team_short),
      points: asNumber(player.points),
      valuation: asNumber(player.valuation),
    }));
    const selected = selectIdealLineup(candidates);
    const toPlayer = (player: (typeof selected.idealLineup)[number]) => ({
      id: player.player_id,
      name: player.name,
      position: player.position,
      image: player.img,
      teamName: player.team_short,
      points: player.points,
      valuation: player.valuation,
      role: player.role,
      multiplier: player.multiplier,
      isCaptain: player.is_captain,
    });
    const maximum = Math.max(...candidates.map((player) => player.points));
    const idealById = new Map(selected.idealLineup.map((player) => [player.player_id, player]));

    return {
      id: row.id,
      type: 'round_highlight',
      occurredAt,
      roundId: asNumber(payload.roundId),
      roundName: asString(payload.roundName, 'Jornada'),
      mvps: candidates
        .filter((player) => player.points === maximum)
        .map((player) =>
          toPlayer(
            idealById.get(player.player_id) ?? {
              ...player,
              role: 'bench',
              multiplier: 0.5,
              is_captain: false,
              stats_points: player.points,
            }
          )
        ),
      idealLineup: selected.idealLineup.map(toPlayer),
      totalPoints: selected.totalPoints,
    };
  }

  if (row.type === 'tournament_round') {
    const rawFixtures = Array.isArray(payload.fixtures) ? payload.fixtures : [];
    const fixtures = rawFixtures.map((fixture) => {
      const item = fixture as Record<string, unknown>;
      return {
        id: asNumber(item.id),
        home: {
          id: asString(item.homeUserId),
          name: asString(item.homeName, 'Manager'),
          icon: nullableString(item.homeIcon),
          colorIndex: asNumber(item.homeColorIndex),
          score: asNumber(item.homeScore),
        },
        away: {
          id: asString(item.awayUserId),
          name: asString(item.awayName, 'Manager'),
          icon: nullableString(item.awayIcon),
          colorIndex: asNumber(item.awayColorIndex),
          score: asNumber(item.awayScore),
        },
      };
    });
    const parsedWinner =
      payload.tournamentStatus === 'finished' && payload.isFinalRound === true
        ? parseTournamentWinner(payload.dataJson)
        : null;
    const managers = fixtures.flatMap((fixture) => [fixture.home, fixture.away]);
    const matchingManager = parsedWinner
      ? managers.find(
          (manager) =>
            (parsedWinner.id !== null && manager.id === parsedWinner.id) ||
            (parsedWinner.id === null && manager.name === parsedWinner.name)
        )
      : null;

    return {
      id: row.id,
      type: 'tournament_round',
      occurredAt,
      tournamentId: asNumber(payload.tournamentId),
      tournamentName: asString(payload.tournamentName, 'Torneo'),
      roundId: asNumber(payload.roundId),
      roundName: asString(payload.roundName, 'Jornada'),
      fixtures,
      champion: parsedWinner
        ? {
            id: parsedWinner.id ?? matchingManager?.id ?? '',
            name: parsedWinner.name ?? matchingManager?.name ?? 'Campeón',
            icon: parsedWinner.icon ?? matchingManager?.icon ?? null,
            colorIndex: matchingManager?.colorIndex ?? 0,
          }
        : null,
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

interface GetHomeFeedPageInput {
  filter?: HomeActivityFilter;
  cursor?: string | null;
}

export async function getHomeFeedPage({
  filter = 'all',
  cursor: cursorValue = null,
}: GetHomeFeedPageInput = {}): Promise<HomeFeedPage> {
  const cursor = cursorValue ? decodeHomeFeedCursor(cursorValue, filter) : null;
  const rows = await queryHomeActivityRows({
    cursor,
    filter,
    limit: HOME_FEED_PAGE_SIZE + 1,
  });
  const pageRows = rows.slice(0, HOME_FEED_PAGE_SIZE);
  const hasMore = rows.length > HOME_FEED_PAGE_SIZE;
  const boundary = pageRows.at(-1);
  const highlightRoundIds = pageRows
    .filter((row) => row.type === 'round_highlight')
    .map((row) => asNumber(row.payload.roundId));
  const highlightPlayers = await queryHomeRoundHighlightPlayers(highlightRoundIds);
  const highlightsByRound = new Map<number, HomeRoundHighlightPlayerRow[]>();
  for (const player of highlightPlayers) {
    const roundPlayers = highlightsByRound.get(asNumber(player.round_id)) ?? [];
    roundPlayers.push(player);
    highlightsByRound.set(asNumber(player.round_id), roundPlayers);
  }
  const items = pageRows
    .map((row) =>
      normalizeActivityRow(
        row,
        row.type === 'round_highlight'
          ? (highlightsByRound.get(asNumber(row.payload.roundId)) ?? [])
          : []
      )
    )
    .filter((item): item is HomeActivityEvent => item !== null);

  return {
    items,
    hasMore,
    nextCursor:
      hasMore && boundary
        ? encodeHomeFeedCursor({
            occurredAt: new Date(boundary.occurred_at).toISOString(),
            id: boundary.id,
            filter,
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
      startsAt: activeRound?.start_date ? new Date(activeRound.start_date).toISOString() : null,
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
