import 'server-only';

import {
  fetchCaptainRecommendations,
  fetchCaptainStats,
  fetchEfficiencyStats,
  fetchLeagueComparisonStats,
  fetchMarketOpportunities,
  fetchMarketStats,
  fetchMarketTrendsAnalysis,
  fetchRecentTransfers,
  fetchReliabilityStats,
  fetchRoundStandings,
  fetchRoundWinners,
  fetchUserLineup,
  fetchUserRecentRounds,
  fetchUserSeasonStats,
  fetchUserSquadDetails,
  fetchUserTopContributors,
  fetchValueRanking,
  fetchVolatilityStats,
  getCompareDataLite,
  getCurrentRoundState,
  getFullStandings,
  getLeagueOverview,
  getNextRoundData,
  getUserPerformanceHistoryService,
  getUserScheduleService,
} from '@/lib/services';
import { buildPlayerContextForMessage } from '@/lib/services/features/assistantPlayerContextService';

export interface AssistantContextBlock {
  label: string;
  content: string;
}

export interface AssistantContextRequest {
  userId: string;
  message: string;
}

type ContextProviderName = 'players' | 'my_team' | 'market' | 'standings' | 'rounds' | 'compare';

interface ContextProvider {
  name: ContextProviderName;
  label: string;
  matches: (message: string) => boolean;
  build: (request: AssistantContextRequest) => Promise<string | null>;
}

const MAX_BLOCK_CHARS = 3000;
const MAX_TOTAL_CONTEXT_CHARS = 12000;

const INTENT_PATTERNS: Record<ContextProviderName, RegExp[]> = {
  players: [
    /\bjugador(?:es)?\b/i,
    /\bplayer(?:s)?\b/i,
    /\bperfil\b/i,
    /\bpuntos\b/i,
    /\bmedia\b/i,
    /\bprecio\b/i,
    /\bvalor\b/i,
    /\bcapitan(?:es)?\b/i,
    /\bcapit[aá]n(?:es)?\b/i,
  ],
  my_team: [
    /\bmi\s+(?:equipo|plantilla|roster|squad|alineaci[oó]n)\b/i,
    /\bmis\s+jugadores\b/i,
    /\bplantilla\b/i,
    /\bvendo\b/i,
    /\bvender\b/i,
    /\bcapitan(?:es)?\b/i,
    /\bcapit[aá]n(?:es)?\b/i,
    /\ba\s+qui[eé]n\s+(?:vendo|pongo|ficho)\b/i,
    /\bqu[ií]en\s+est[aá]\s+peor\b/i,
  ],
  market: [
    /\bmercado\b/i,
    /\bfichaj(?:e|es)\b/i,
    /\btransfer(?:encia|encias)?\b/i,
    /\bcompr(?:a|ar|o)\b/i,
    /\bvend(?:e|er|o|ido)\b/i,
    /\bprecio\b/i,
    /\bvalor\b/i,
    /\bsub(?:e|iendo|ida)\b/i,
    /\bbaj(?:a|ando|ada)\b/i,
    /\boportunidad(?:es)?\b/i,
  ],
  standings: [
    /\bclasificaci[oó]n\b/i,
    /\bstandings\b/i,
    /\bl[ií]der\b/i,
    /\branking\b/i,
    /\bposici[oó]n\b/i,
    /\bliga\b/i,
    /\bracha(?:s)?\b/i,
    /\bregular(?:idad)?\b/i,
    /\beficiencia\b/i,
  ],
  rounds: [
    /\bjornada(?:s)?\b/i,
    /\bronda(?:s)?\b/i,
    /\bcalendario\b/i,
    /\bpartido(?:s)?\b/i,
    /\bpr[oó]xim(?:a|o|os|as)\b/i,
    /\b[uú]ltim(?:a|o)\s+jornada\b/i,
    /\balineaci[oó]n\b/i,
    /\blineup\b/i,
  ],
  compare: [
    /\bcompara(?:r|me)?\b/i,
    /\bcomparaci[oó]n\b/i,
    /\bcontra\b/i,
    /\bvs\.?\b/i,
    /\bversus\b/i,
    /\bqui[eé]n\s+es\s+m[aá]s\b/i,
    /\bficha\s+mejor\b/i,
    /\bd[oó]nde\s+estoy\s+perdiendo\b/i,
  ],
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function hasCapitalizedName(message: string): boolean {
  return /\b[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]{2,}(?:\s+[A-ZÁÉÍÓÚÜÑ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ'-]{2,}){0,2}\b/.test(
    message
  );
}

function matchesIntent(name: ContextProviderName, message: string): boolean {
  const normalizedMessage = normalizeText(message);

  if (name === 'players' && hasCapitalizedName(message)) {
    return true;
  }

  return INTENT_PATTERNS[name].some((pattern) => pattern.test(normalizedMessage));
}

function limitText(value: string, maxLength: number = MAX_BLOCK_CHARS): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 18).trimEnd()}\n[context truncated]`;
}

function compactValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'N/D';
  if (typeof value === 'number') return new Intl.NumberFormat('es-ES').format(value);
  if (typeof value === 'boolean') return value ? 'sí' : 'no';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function pickFirst(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return undefined;
}

function pickNumeric(record: Record<string, unknown>, keys: string[]): number {
  const value = pickFirst(record, keys);
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatNameValue(record: Record<string, unknown>, label: string, keys: string[]): string {
  return `${label}: ${compactValue(pickFirst(record, keys))}`;
}

function formatItems(
  value: unknown,
  formatter: (item: Record<string, unknown>, index: number) => string,
  limit: number = 6
): string {
  const items = asArray(value).slice(0, limit);
  if (items.length === 0) return 'N/D';
  return items.map(formatter).join('; ');
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[redacted-email]')
    .replace(
      /\b(password|biwenger_token|biwengerToken|token|secret|api[_-]?key|authorization)\b\s*[:=]\s*[^,\n;}]+/gi,
      '$1: [redacted]'
    );
}

function getRecordName(record: Record<string, unknown>): string {
  return compactValue(pickFirst(record, ['name', 'user_name', 'manager_name']));
}

function getRecordId(record: Record<string, unknown>): string | null {
  const id = pickFirst(record, ['id', 'user_id', 'manager_id']);
  return id === undefined ? null : String(id);
}

function nameMatchesMessage(record: Record<string, unknown>, message: string): boolean {
  const name = normalizeText(getRecordName(record));
  const normalizedMessage = normalizeText(message);
  return name.length >= 3 && normalizedMessage.includes(name);
}

function filterRowsForUsers(
  rows: unknown,
  users: Record<string, unknown>[]
): Record<string, unknown>[] {
  const userIds = new Set(users.map(getRecordId).filter(Boolean));
  const userNames = new Set(users.map((user) => normalizeText(getRecordName(user))));

  return asArray(rows).filter((row) => {
    const rowId = getRecordId(row);
    const rowName = normalizeText(getRecordName(row));
    return (rowId && userIds.has(rowId)) || userNames.has(rowName);
  });
}

function formatSellCandidates(players: Record<string, unknown>[]): string {
  const candidates = [...players]
    .map((player) => {
      const priceIncrement = pickNumeric(player, ['price_increment']);
      const points = pickNumeric(player, ['points', 'total_points']);
      const average = pickNumeric(player, ['average', 'avg_points']);
      const price = pickNumeric(player, ['price']);
      const sellScore =
        (priceIncrement < 0 ? Math.abs(priceIncrement) / 100000 : 0) +
        (average > 0 ? Math.max(0, 8 - average) : 2) +
        (points > 0 ? 0 : 2);

      return { player, sellScore, priceIncrement, average, price };
    })
    .filter((candidate) => candidate.sellScore > 0)
    .sort((a, b) => b.sellScore - a.sellScore)
    .slice(0, 6);

  if (candidates.length === 0) return 'N/D';

  return candidates
    .map(({ player, priceIncrement, average, price }) => {
      const reasons = [
        priceIncrement < 0 ? `baja de precio ${compactValue(priceIncrement)}` : null,
        average > 0 && average < 8 ? `media baja ${compactValue(average)}` : null,
        price > 0 ? `precio ${compactValue(price)}` : null,
      ].filter(Boolean);

      return `${compactValue(pickFirst(player, ['name']))}: ${reasons.join(', ') || 'revisar rol/forma'}`;
    })
    .join('; ');
}

async function buildPlayerContext(request: AssistantContextRequest): Promise<string | null> {
  return await buildPlayerContextForMessage(request.message);
}

async function buildMyTeamContext(request: AssistantContextRequest): Promise<string | null> {
  const [squad, seasonStats, recentRounds, captainStats, captainRecommendations, contributors] =
    await Promise.all([
      fetchUserSquadDetails(request.userId),
      fetchUserSeasonStats(request.userId),
      fetchUserRecentRounds(request.userId),
      fetchCaptainStats(request.userId),
      fetchCaptainRecommendations(request.userId, 6),
      fetchUserTopContributors(request.userId),
    ]);

  const squadRecord = asRecord(squad);
  const seasonRecord = asRecord(seasonStats);
  const captainRecord = asRecord(captainStats);
  const players = asArray(squadRecord.players);

  const sections = [
    'Signed-in user context:',
    [
      formatNameValue(seasonRecord, 'Usuario', ['name']),
      formatNameValue(seasonRecord, 'Posición liga', ['position']),
      formatNameValue(seasonRecord, 'Puntos totales', ['total_points']),
      formatNameValue(seasonRecord, 'Media por jornada', ['average_points']),
      formatNameValue(seasonRecord, 'Mejor jornada', ['best_round']),
      formatNameValue(seasonRecord, 'Peor jornada', ['worst_round']),
      formatNameValue(seasonRecord, 'Victorias de jornada', ['victories']),
      formatNameValue(seasonRecord, 'Podios', ['podiums']),
      formatNameValue(squadRecord, 'Valor plantilla', ['total_value']),
      formatNameValue(squadRecord, 'Tendencia precio plantilla', ['price_trend']),
      formatNameValue(squadRecord, 'Jugadores plantilla', ['player_count']),
    ].join('\n'),
    `Top jugadores plantilla: ${formatItems(
      players,
      (player) => {
        const name = compactValue(pickFirst(player, ['name']));
        const team = compactValue(pickFirst(player, ['team_short_name', 'team']));
        const position = compactValue(pickFirst(player, ['position']));
        const points = compactValue(pickFirst(player, ['points', 'total_points']));
        const average = compactValue(pickFirst(player, ['average', 'avg_points']));
        const price = compactValue(pickFirst(player, ['price']));
        const increment = compactValue(pickFirst(player, ['price_increment']));
        return `${name} (${team}, ${position}): ${points} pts, media ${average}, precio ${price}, variación ${increment}`;
      },
      10
    )}`,
    `Subidas de precio: ${formatItems(squadRecord.top_rising, (player) => {
      return `${compactValue(pickFirst(player, ['name']))} +${compactValue(
        pickFirst(player, ['price_increment'])
      )}`;
    })}`,
    `Bajadas de precio: ${formatItems(squadRecord.top_falling, (player) => {
      return `${compactValue(pickFirst(player, ['name']))} ${compactValue(
        pickFirst(player, ['price_increment'])
      )}`;
    })}`,
    `Candidatos a venta por señales de plantilla: ${formatSellCandidates(players)}`,
    `Últimas jornadas usuario: ${formatItems(
      recentRounds,
      (round) => {
        return `${compactValue(pickFirst(round, ['round_name', 'name', 'round_id']))}: ${compactValue(
          pickFirst(round, ['points', 'total_points'])
        )} pts, posición ${compactValue(pickFirst(round, ['position', 'rank']))}`;
      },
      6
    )}`,
    `Capitanes: ${[
      formatNameValue(captainRecord, 'Rondas con capitán', ['total_rounds']),
      formatNameValue(captainRecord, 'Extra puntos capitán', ['extra_points']),
      formatNameValue(captainRecord, 'Media capitán', ['avg_points']),
    ].join(', ')}`,
    `Recomendaciones capitán: ${formatItems(captainRecommendations, (player) => {
      return `${compactValue(pickFirst(player, ['name']))} (${compactValue(
        pickFirst(player, ['position'])
      )}): media reciente ${compactValue(pickFirst(player, ['avg_recent_points']))}, forma ${compactValue(
        pickFirst(player, ['form_label'])
      )}`;
    })}`,
    `Principales contribuidores: ${formatItems(
      contributors,
      (player) => {
        return `${compactValue(pickFirst(player, ['name']))}: ${compactValue(
          pickFirst(player, ['points', 'total_points'])
        )} pts`;
      },
      8
    )}`,
  ];

  return sections.join('\n');
}

async function buildMarketContext(): Promise<string | null> {
  const [marketStats, opportunities, recentTransfers, trends] = await Promise.all([
    fetchMarketStats(),
    fetchMarketOpportunities(8),
    fetchRecentTransfers(8),
    fetchMarketTrendsAnalysis(14),
  ]);
  const stats = asRecord(marketStats);

  return [
    'Market context:',
    `KPIs mercado: ${JSON.stringify(asRecord(stats.kpis))}`,
    `Jugadores en mercado: ${formatItems(
      stats.currentMarketListings,
      (listing) => {
        return `${compactValue(pickFirst(listing, ['player_name', 'name']))}: precio ${compactValue(
          pickFirst(listing, ['price', 'precio'])
        )}, propietario ${compactValue(pickFirst(listing, ['owner_name', 'seller_name', 'vendedor']))}`;
      },
      10
    )}`,
    `Oportunidades mercado: ${formatItems(
      opportunities,
      (player) => {
        return `${compactValue(pickFirst(player, ['name', 'player_name']))}: ${compactValue(
          pickFirst(player, ['price', 'precio'])
        )}, media ${compactValue(pickFirst(player, ['average', 'avg_points', 'points_per_match']))}`;
      },
      8
    )}`,
    `Transferencias recientes: ${formatItems(
      recentTransfers,
      (transfer) => {
        return `${compactValue(pickFirst(transfer, ['player_name', 'name']))}: ${compactValue(
          pickFirst(transfer, ['buyer_name', 'comprador'])
        )} pagó ${compactValue(pickFirst(transfer, ['price', 'precio', 'amount']))}`;
      },
      8
    )}`,
    `Tendencias mercado 14 días: ${formatItems(
      trends,
      (trend) => {
        return `${compactValue(pickFirst(trend, ['name', 'date', 'label']))}: ${compactValue(
          pickFirst(trend, ['value', 'price', 'count', 'total'])
        )}`;
      },
      8
    )}`,
    `Destacados mercado: ${[
      `más transferido ${formatItems(stats.topPlayer, (item) => compactValue(pickFirst(item, ['name', 'player_name'])), 1)}`,
      `mejor valor ${formatItems(stats.bestValue, (item) => compactValue(pickFirst(item, ['name', 'player_name'])), 1)}`,
      `mayor revalorización ${formatItems(
        stats.bestRevaluation,
        (item) =>
          `${compactValue(pickFirst(item, ['name', 'player_name']))} ${compactValue(
            pickFirst(item, ['price_increment', 'increment', 'value'])
          )}`,
        1
      )}`,
      `peor revalorización ${formatItems(
        stats.worstRevaluation,
        (item) =>
          `${compactValue(pickFirst(item, ['name', 'player_name']))} ${compactValue(
            pickFirst(item, ['price_increment', 'increment', 'value'])
          )}`,
        1
      )}`,
    ].join('; ')}`,
  ].join('\n');
}

async function buildLeagueContext(request: AssistantContextRequest): Promise<string | null> {
  const [standings, overview, valueRanking, roundWinners, efficiency, volatility, reliability] =
    await Promise.all([
      getFullStandings({}),
      getLeagueOverview(),
      fetchValueRanking(),
      fetchRoundWinners(8),
      fetchEfficiencyStats(),
      fetchVolatilityStats(),
      fetchReliabilityStats(),
    ]);
  const overviewRecord = asRecord(overview);
  const standingsRows = asArray(standings);
  const userRow = standingsRows.find(
    (row) => String(pickFirst(row, ['id', 'user_id'])) === request.userId
  );
  const visibleStandings = standingsRows.slice(0, 8);
  if (userRow && !visibleStandings.includes(userRow)) visibleStandings.push(userRow);

  return [
    'League context:',
    `Resumen liga: ${[
      formatNameValue(overviewRecord, 'Managers', ['user_count', 'users', 'managers']),
      formatNameValue(overviewRecord, 'Puntos totales', ['total_points']),
      formatNameValue(overviewRecord, 'Valor total', ['total_value']),
      formatNameValue(overviewRecord, 'Jornadas jugadas', ['rounds_played']),
    ].join(', ')}`,
    `Clasificación: ${formatItems(
      visibleStandings,
      (row, index) => {
        return `${compactValue(pickFirst(row, ['position', 'rank']) ?? index + 1)}. ${compactValue(
          pickFirst(row, ['name', 'user_name'])
        )}: ${compactValue(pickFirst(row, ['total_points', 'points']))} pts, valor ${compactValue(
          pickFirst(row, ['team_value', 'total_value', 'squad_value'])
        )}`;
      },
      visibleStandings.length
    )}`,
    `Ranking valor: ${formatItems(
      valueRanking,
      (row, index) => {
        return `${index + 1}. ${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
          pickFirst(row, ['team_value', 'total_value', 'value'])
        )}`;
      },
      8
    )}`,
    `Ganadores de jornada: ${formatItems(
      roundWinners,
      (row) => {
        return `${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
          pickFirst(row, ['wins', 'victories', 'count'])
        )}`;
      },
      8
    )}`,
    `Eficiencia managers: ${formatItems(efficiency, (row) => {
      return `${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
        pickFirst(row, ['efficiency', 'efficiency_rating', 'value'])
      )}`;
    })}`,
    `Regularidad managers: ${formatItems(reliability, (row) => {
      return `${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
        pickFirst(row, ['reliability', 'consistency', 'value'])
      )}`;
    })}`,
    `Volatilidad managers: ${formatItems(volatility, (row) => {
      return `${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
        pickFirst(row, ['volatility', 'stddev', 'standard_deviation', 'value'])
      )}`;
    })}`,
  ].join('\n');
}

async function buildRoundsContext(request: AssistantContextRequest): Promise<string | null> {
  const [roundState, nextRound, schedule, history] = await Promise.all([
    getCurrentRoundState(),
    getNextRoundData(request.userId),
    getUserScheduleService(request.userId),
    getUserPerformanceHistoryService(request.userId),
  ]);
  const roundStateRecord = asRecord(roundState);
  const currentRound = asRecord(roundStateRecord.currentRound);
  const nextRoundRecord = asRecord(asRecord(nextRound).nextRound);
  const targetRoundId =
    pickFirst(currentRound, ['id', 'round_id']) ?? pickFirst(nextRoundRecord, ['id', 'round_id']);

  const [lineup, roundStandings] = targetRoundId
    ? await Promise.all([
        fetchUserLineup(request.userId, String(targetRoundId)),
        fetchRoundStandings(String(targetRoundId)),
      ])
    : [null, []];

  const scheduleRecord = asRecord(schedule);

  return [
    'Round/schedule context:',
    `Jornada actual: ${compactValue(pickFirst(currentRound, ['name', 'round_name', 'id', 'round_id']))}`,
    `Próxima jornada: ${compactValue(pickFirst(nextRoundRecord, ['name', 'round_name', 'id', 'round_id']))}`,
    `Partidos con jugadores del usuario: ${formatItems(
      scheduleRecord.matches,
      (match) => {
        return `${compactValue(pickFirst(match, ['home_team', 'home_name']))} vs ${compactValue(
          pickFirst(match, ['away_team', 'away_name'])
        )}: ${compactValue(pickFirst(match, ['total_players', 'user_players_count']))} jugadores`;
      },
      8
    )}`,
    `Jugadores del usuario en calendario: ${formatItems(
      scheduleRecord.userPlayers,
      (player) => {
        return `${compactValue(pickFirst(player, ['name']))} (${compactValue(pickFirst(player, ['team']))})`;
      },
      12
    )}`,
    `Alineación consultada: ${formatItems(
      asRecord(lineup).players,
      (player) => {
        return `${compactValue(pickFirst(player, ['name']))} (${compactValue(
          pickFirst(player, ['position'])
        )}) ${compactValue(pickFirst(player, ['points', 'fantasy_points']))} pts`;
      },
      12
    )}`,
    `Historial eficiencia reciente: ${formatItems(
      history,
      (round) => {
        return `${compactValue(pickFirst(round, ['round_name', 'name', 'round_id']))}: real ${compactValue(
          pickFirst(round, ['actual_points', 'points'])
        )}, ideal ${compactValue(pickFirst(round, ['ideal_points']))}`;
      },
      6
    )}`,
    `Clasificación jornada: ${formatItems(
      roundStandings,
      (row, index) => {
        return `${index + 1}. ${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
          pickFirst(row, ['points', 'total_points'])
        )} pts`;
      },
      8
    )}`,
  ].join('\n');
}

async function buildComparisonContext(request: AssistantContextRequest): Promise<string | null> {
  const [compareData, leagueComparison, efficiency, reliability] = await Promise.all([
    getCompareDataLite(),
    fetchLeagueComparisonStats(),
    fetchEfficiencyStats(),
    fetchReliabilityStats(),
  ]);
  const compareRecord = asRecord(compareData);
  const users = asArray(compareRecord.users);
  const signedInUser = users.find(
    (user) => String(pickFirst(user, ['id', 'user_id'])) === request.userId
  );
  const mentionedUsers = users.filter((user) => nameMatchesMessage(user, request.message));
  const focusUsers = [signedInUser, ...mentionedUsers].filter(Boolean) as Record<string, unknown>[];
  const focusedStandings = filterRowsForUsers(compareRecord.standings, focusUsers);
  const focusedLeagueComparison = filterRowsForUsers(leagueComparison, focusUsers);
  const focusedEfficiency = filterRowsForUsers(efficiency, focusUsers);
  const focusedReliability = filterRowsForUsers(reliability, focusUsers);

  return [
    'Comparison context:',
    `Managers disponibles: ${formatItems(users, (user) => compactValue(pickFirst(user, ['name'])), 20)}`,
    `Usuario firmado: ${compactValue(pickFirst(asRecord(signedInUser), ['name']))}`,
    `Managers mencionados en la pregunta: ${formatItems(mentionedUsers, (user) => compactValue(pickFirst(user, ['name'])), 6)}`,
    `Clasificación comparativa: ${formatItems(
      focusedStandings.length > 0 ? focusedStandings : compareRecord.standings,
      (row, index) => {
        return `${compactValue(pickFirst(row, ['position', 'rank']) ?? index + 1)}. ${compactValue(
          pickFirst(row, ['name', 'user_name'])
        )}: ${compactValue(pickFirst(row, ['points', 'total_points']))} pts`;
      },
      10
    )}`,
    `Comparación con liga: ${formatItems(
      focusedLeagueComparison.length > 0 ? focusedLeagueComparison : leagueComparison,
      (row) => {
        return `${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
          pickFirst(row, ['metric', 'category', 'label'])
        )} ${compactValue(pickFirst(row, ['value', 'score', 'difference']))}`;
      },
      8
    )}`,
    `Eficiencia: ${formatItems(
      focusedEfficiency.length > 0 ? focusedEfficiency : efficiency,
      (row) => {
        return `${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
          pickFirst(row, ['efficiency', 'efficiency_rating', 'value'])
        )}`;
      },
      8
    )}`,
    `Regularidad: ${formatItems(
      focusedReliability.length > 0 ? focusedReliability : reliability,
      (row) => {
        return `${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
          pickFirst(row, ['reliability', 'consistency', 'value'])
        )}`;
      },
      8
    )}`,
    `Predicciones porras: ${formatItems(
      asRecord(compareRecord.predictions).promedios,
      (row) => {
        return `${compactValue(pickFirst(row, ['name', 'user_name']))}: ${compactValue(
          pickFirst(row, ['average', 'avg', 'points'])
        )}`;
      },
      8
    )}`,
  ].join('\n');
}

const PROVIDERS: ContextProvider[] = [
  {
    name: 'players',
    label: 'Player context',
    matches: (message) => matchesIntent('players', message),
    build: buildPlayerContext,
  },
  {
    name: 'my_team',
    label: 'Signed-in user context',
    matches: (message) => matchesIntent('my_team', message),
    build: buildMyTeamContext,
  },
  {
    name: 'market',
    label: 'Market context',
    matches: (message) => matchesIntent('market', message),
    build: buildMarketContext,
  },
  {
    name: 'standings',
    label: 'League context',
    matches: (message) => matchesIntent('standings', message),
    build: buildLeagueContext,
  },
  {
    name: 'rounds',
    label: 'Round/schedule context',
    matches: (message) => matchesIntent('rounds', message),
    build: buildRoundsContext,
  },
  {
    name: 'compare',
    label: 'Comparison context',
    matches: (message) => matchesIntent('compare', message),
    build: buildComparisonContext,
  },
];

export function getAssistantContextProviderNamesForMessage(message: string): ContextProviderName[] {
  return PROVIDERS.filter((provider) => provider.matches(message)).map((provider) => provider.name);
}

export async function buildAssistantContext(
  request: AssistantContextRequest
): Promise<AssistantContextBlock[]> {
  const selectedProviders = PROVIDERS.filter((provider) => provider.matches(request.message));
  const blocks: AssistantContextBlock[] = [];
  let remainingChars = MAX_TOTAL_CONTEXT_CHARS;

  if (process.env.NODE_ENV === 'development') {
    console.debug(
      '[Assistant Context] selected providers:',
      selectedProviders.map((provider) => provider.name)
    );
  }

  for (const provider of selectedProviders) {
    if (remainingChars <= 0) break;

    try {
      const content = await provider.build(request);
      if (!content) continue;

      const redactedContent = limitText(
        redactSensitiveText(content),
        Math.min(MAX_BLOCK_CHARS, remainingChars)
      );
      blocks.push({ label: provider.label, content: redactedContent });
      remainingChars -= redactedContent.length;
    } catch (error) {
      console.error(`[Assistant Context] ${provider.name} provider failed:`, error);
    }
  }

  return blocks;
}

export function formatAssistantContextBlocks(blocks: AssistantContextBlock[]): string | null {
  if (blocks.length === 0) return null;

  return blocks.map((block) => `## ${block.label}\n${block.content}`).join('\n\n---\n\n');
}
