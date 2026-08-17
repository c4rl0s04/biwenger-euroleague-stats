import 'server-only';
import generatedSimulationResults from '../../../data/season-simulation-results.json';
import { getSeasonReviewRawData, type SeasonReviewRawData } from '../../db';
import {
  analyzeRosterCaps,
  buildEconomicLedger,
  gini,
  resilienceRequestSchema,
  simulateRecovery,
} from '../../season-review/resilience';
import {
  buildSeasonSimulationDataset,
  calibrateSeasonSimulator,
} from '../../season-review/simulation-dataset';
import { runSeasonMonteCarlo } from '../../season-review/season-simulator';
import type {
  SeasonMonteCarloResult,
  SeasonSimulationArtifact,
  SeasonSimulationDataset,
} from '../../season-review/simulation-types';
import {
  REVIEW_SEASON_ID,
  type EconomicLedger,
  type EconomicSnapshot,
  type GapAutopsy,
  type GapContribution,
  type HistoricalTimelinePoint,
  type HistoricalUserPoint,
  type PairMoment,
  type RecoveryEnvironment,
  type RecoveryResult,
  type ResilienceConfig,
  type ResilienceRecommendation,
  type ResilienceScores,
  type SeasonRecoveryAnalysis,
  type SeasonReviewOverviewV2,
  type ShockConfig,
} from '../../season-review/types';
import { cached, CACHE_TTL } from '../../utils/cache';

const STARTING_BUDGET = 40_000_000;
const INTERACTIVE_SIMULATION_RUNS = 16;
const simulationArtifact = generatedSimulationResults as SeasonSimulationArtifact;
const USER_COLORS = ['#fa5001', '#38bdf8', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#94a3b8'];

export const HISTORICAL_RESILIENCE_CONFIG: ResilienceConfig = {
  rosterCap: 25,
  payoutDirection: 'inverse',
  eurosPerPoint: 10_000,
  marketSlots: 20,
};

export const DEFAULT_RECOVERY_SHOCK: ShockConfig = {
  kind: 'bad-transfer',
  severity: 'medium',
  appliedRound: 5,
};

const dayOf = (value: string) => value.slice(0, 10);

function previousDay(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function sameConfig(left: ResilienceConfig, right: ResilienceConfig) {
  return (
    left.rosterCap === right.rosterCap &&
    left.payoutDirection === right.payoutDirection &&
    left.eurosPerPoint === right.eurosPerPoint &&
    left.marketSlots === right.marketSlots
  );
}

function sameShock(left: ShockConfig, right: ShockConfig) {
  return (
    left.kind === right.kind &&
    left.severity === right.severity &&
    left.appliedRound === right.appliedRound
  );
}

function precomputedSimulation(
  config: ResilienceConfig,
  shock: ShockConfig
): SeasonMonteCarloResult | null {
  if (simulationArtifact.status !== 'ready') return null;
  return (
    simulationArtifact.results.find(
      (entry) => sameConfig(entry.config, config) && sameShock(entry.shock, shock)
    )?.result || null
  );
}

function normalizeLedgerInput(raw: SeasonReviewRawData) {
  const nameToId = new Map(raw.users.map((user) => [user.name, user.id]));
  const firstTransferDay = raw.transfers[0] ? dayOf(raw.transfers[0].fecha) : '2025-09-26';
  const openingDay = previousDay(firstTransferDay);
  const financeDateByRound = new Map<number, string>();
  raw.finances.forEach((row) => {
    if (row.round_id == null) return;
    const day = dayOf(row.date);
    const current = financeDateByRound.get(row.round_id);
    if (!current || day < current) financeDateByRound.set(row.round_id, day);
  });
  const roundDateById = new Map<number, string>();
  raw.userRounds.forEach((row) => {
    const date = row.round_date ? dayOf(row.round_date) : financeDateByRound.get(row.round_id);
    if (date) roundDateById.set(row.round_id, date);
  });

  const days = new Set<string>([openingDay]);
  raw.marketValues.forEach((row) => {
    const day = dayOf(row.date);
    if (day >= openingDay) days.add(day);
  });
  raw.transfers.forEach((row) => days.add(dayOf(row.fecha)));
  raw.finances.forEach((row) => days.add(dayOf(row.date)));
  roundDateById.forEach((day) => days.add(day));

  return {
    input: {
      startingBudget: STARTING_BUDGET,
      users: raw.users.map((user) => ({ id: user.id, name: user.name })),
      initialSquads: raw.initialSquads.map((row) => ({
        userId: row.user_id,
        playerId: Number(row.player_id),
        price: Number(row.price),
      })),
      days: Array.from(days).sort(),
      marketValues: raw.marketValues.map((row) => ({
        day: dayOf(row.date),
        playerId: Number(row.player_id),
        price: Number(row.price),
      })),
      transfers: raw.transfers.map((row) => ({
        day: dayOf(row.fecha),
        timestamp: Number(row.timestamp),
        playerId: Number(row.player_id),
        price: Number(row.precio),
        sellerId: nameToId.get(row.vendedor) || null,
        buyerId: nameToId.get(row.comprador) || null,
      })),
      bonuses: raw.finances
        .filter((row) => row.user_id)
        .map((row) => ({
          day: dayOf(row.date),
          userId: row.user_id,
          amount: Number(row.amount),
        })),
      roundPoints: raw.userRounds
        .filter((row) => row.participated && roundDateById.has(row.round_id))
        .map((row) => ({
          day: roundDateById.get(row.round_id) || openingDay,
          roundId: Number(row.round_id),
          userId: row.user_id,
          points: Number(row.points),
        })),
    },
    roundDateById,
  };
}

function groupSnapshots(ledger: EconomicLedger) {
  const byDay = new Map<string, EconomicSnapshot[]>();
  ledger.snapshots.forEach((snapshot) => {
    const rows = byDay.get(snapshot.day) || [];
    rows.push(snapshot);
    byDay.set(snapshot.day, rows);
  });
  return byDay;
}

function toHistoricalUser(
  snapshot: EconomicSnapshot,
  colors: Map<string, string>
): HistoricalUserPoint {
  return {
    userId: snapshot.userId,
    name: snapshot.userName,
    color: colors.get(snapshot.userId) || '#94a3b8',
    cash: snapshot.cash,
    squadValue: snapshot.squadValue,
    totalResources: snapshot.totalResources,
    rosterSize: snapshot.rosterSize,
    cumulativeBonuses: snapshot.cumulativeBonuses,
    cumulativePoints: snapshot.cumulativePoints,
  };
}

function buildTimeline(
  ledger: EconomicLedger,
  colors: Map<string, string>
): HistoricalTimelinePoint[] {
  const byDay = groupSnapshots(ledger);
  const days = Array.from(byDay.keys()).sort();
  return days
    .filter((_, index) => index === 0 || index === days.length - 1 || index % 7 === 0)
    .map((day) => {
      const snapshots = byDay.get(day) || [];
      const resources = snapshots.map((row) => row.totalResources);
      const squads = snapshots.map((row) => row.squadValue);
      return {
        day,
        resourceGini: gini(resources),
        squadGini: gini(squads),
        absoluteResourceGap: resources.length ? Math.max(...resources) - Math.min(...resources) : 0,
        absoluteSquadGap: squads.length ? Math.max(...squads) - Math.min(...squads) : 0,
        users: snapshots.map((snapshot) => toHistoricalUser(snapshot, colors)),
      };
    });
}

function closestDay(byDay: Map<string, EconomicSnapshot[]>, target: string) {
  return (
    Array.from(byDay.keys())
      .filter((day) => day <= target)
      .sort()
      .at(-1) || Array.from(byDay.keys()).sort()[0]
  );
}

function buildPairMoment(
  byDay: Map<string, EconomicSnapshot[]>,
  targetDay: string,
  leaderId: string,
  laggardId: string,
  colors: Map<string, string>
): PairMoment {
  const day = closestDay(byDay, targetDay);
  const rows = byDay.get(day) || [];
  const leaderSnapshot = rows.find((row) => row.userId === leaderId);
  const laggardSnapshot = rows.find((row) => row.userId === laggardId);
  if (!leaderSnapshot || !laggardSnapshot) throw new Error('Incomplete historical ledger');
  const leader = toHistoricalUser(leaderSnapshot, colors);
  const laggard = toHistoricalUser(laggardSnapshot, colors);
  return {
    day,
    leader,
    laggard,
    resourceGap: leader.totalResources - laggard.totalResources,
    squadGap: leader.squadValue - laggard.squadValue,
    pointsGap: leader.cumulativePoints - laggard.cumulativePoints,
  };
}

function contribution(
  id: GapContribution['id'],
  label: string,
  leaderValue: number,
  laggardValue: number
): GapContribution {
  const gapContribution = leaderValue - laggardValue;
  return {
    id,
    label,
    leaderValue,
    laggardValue,
    gapContribution,
    interpretation:
      gapContribution > 0
        ? `Amplió la ventaja en ${(gapContribution / 1_000_000).toFixed(1)} M€.`
        : gapContribution < 0
          ? `Contuvo la ventaja en ${(Math.abs(gapContribution) / 1_000_000).toFixed(1)} M€.`
          : 'No alteró la brecha.',
  };
}

function contributionsAt(
  byDay: Map<string, EconomicSnapshot[]>,
  day: string,
  leaderId: string,
  laggardId: string
) {
  const rows = byDay.get(closestDay(byDay, day)) || [];
  const leader = rows.find((row) => row.userId === leaderId);
  const laggard = rows.find((row) => row.userId === laggardId);
  if (!leader || !laggard) return [];
  return [
    contribution(
      'initial-assets',
      'Suerte del reparto inicial',
      leader.initialAssetPnl,
      laggard.initialAssetPnl
    ),
    contribution(
      'market',
      'Fichajes y revalorizaciones',
      leader.marketAssetPnl,
      laggard.marketAssetPnl
    ),
    contribution(
      'bonuses',
      'Primas acumuladas',
      leader.cumulativeBonuses,
      laggard.cumulativeBonuses
    ),
  ];
}

function initialPotential(raw: SeasonReviewRawData, userId: string) {
  const initialPlayers = new Set(
    raw.initialSquads.filter((row) => row.user_id === userId).map((row) => Number(row.player_id))
  );
  return raw.playerStats
    .filter((row) => initialPlayers.has(Number(row.player_id)))
    .reduce((sum, row) => sum + Number(row.fantasy_points), 0);
}

function buildAutopsy(
  raw: SeasonReviewRawData,
  ledger: EconomicLedger,
  roundDateById: Map<number, string>,
  colors: Map<string, string>
): GapAutopsy {
  const byDay = groupSnapshots(ledger);
  const days = Array.from(byDay.keys()).sort();
  const finalRows = byDay.get(days.at(-1) || '') || [];
  const sortedByPoints = [...finalRows].sort(
    (left, right) => right.cumulativePoints - left.cumulativePoints
  );
  const leader = sortedByPoints[0];
  const laggard = sortedByPoints.at(-1);
  if (!leader || !laggard) throw new Error('Season review requires at least two users');
  const roundDays = Array.from(new Set(roundDateById.values())).sort();
  const midpointDay =
    roundDays[Math.floor(roundDays.length / 2)] || days[Math.floor(days.length / 2)];
  const opening = buildPairMoment(byDay, days[0], leader.userId, laggard.userId, colors);
  const midpoint = buildPairMoment(byDay, midpointDay, leader.userId, laggard.userId, colors);
  const closing = buildPairMoment(
    byDay,
    days.at(-1) || days[0],
    leader.userId,
    laggard.userId,
    colors
  );
  const firstTenMillionGapDay = days.find((day) => {
    const rows = byDay.get(day) || [];
    const first = rows.find((row) => row.userId === leader.userId);
    const last = rows.find((row) => row.userId === laggard.userId);
    return first && last && Math.abs(first.totalResources - last.totalResources) >= 10_000_000;
  });

  return {
    leaderId: leader.userId,
    leaderName: leader.userName,
    laggardId: laggard.userId,
    laggardName: laggard.userName,
    firstTenMillionGapDay: firstTenMillionGapDay || null,
    opening,
    midpoint,
    closing,
    midpointContributions: contributionsAt(byDay, midpoint.day, leader.userId, laggard.userId),
    closingContributions: contributionsAt(byDay, closing.day, leader.userId, laggard.userId),
    initialPotentialPoints: {
      leader: initialPotential(raw, leader.userId),
      laggard: initialPotential(raw, laggard.userId),
    },
  };
}

function observedReturnSamples(raw: SeasonReviewRawData) {
  const nameToId = new Map(raw.users.map((user) => [user.name, user.id]));
  const finalPrices = new Map<number, number>();
  raw.marketValues.forEach((row) => finalPrices.set(Number(row.player_id), Number(row.price)));
  const transfers = [...raw.transfers].sort(
    (left, right) => Number(left.timestamp) - Number(right.timestamp)
  );
  const samples: number[] = [];
  transfers.forEach((purchase, index) => {
    const buyerId = nameToId.get(purchase.comprador);
    if (!buyerId) return;
    const sale = transfers
      .slice(index + 1)
      .find(
        (candidate) =>
          Number(candidate.player_id) === Number(purchase.player_id) &&
          nameToId.get(candidate.vendedor) === buyerId
      );
    const exitValue = sale ? Number(sale.precio) : finalPrices.get(Number(purchase.player_id));
    if (exitValue == null) return;
    const result = exitValue - Number(purchase.precio);
    samples.push(Math.max(-6_000_000, Math.min(result, 6_000_000)));
  });
  return samples.length ? samples : [-500_000, 250_000, 1_000_000];
}

function buildEnvironment(
  raw: SeasonReviewRawData,
  capDiagnostics: ReturnType<typeof analyzeRosterCaps>
): RecoveryEnvironment {
  const byRound = new Map<number, number[]>();
  raw.userRounds
    .filter((row) => row.participated)
    .forEach((row) => {
      const values = byRound.get(row.round_id) || [];
      values.push(Number(row.points));
      byRound.set(row.round_id, values);
    });
  const top: number[] = [];
  const median: number[] = [];
  const bottom: number[] = [];
  byRound.forEach((values) => {
    const sorted = [...values].sort((left, right) => right - left);
    if (!sorted.length) return;
    top.push(sorted[0]);
    median.push(sorted[Math.floor(sorted.length / 2)]);
    bottom.push(sorted.at(-1) || 0);
  });
  return {
    roundsRemaining: Math.max(1, byRound.size - DEFAULT_RECOVERY_SHOCK.appliedRound),
    users: raw.users.length,
    averageTopPoints: average(top),
    averageMedianPoints: average(median),
    averageBottomPoints: average(bottom),
    observedReturnSamples: observedReturnSamples(raw),
    capLiquidityByLimit: Object.fromEntries(
      capDiagnostics.map((diagnostic) => [
        diagnostic.cap,
        diagnostic.averageMinimumReleaseValue * diagnostic.breachRate,
      ])
    ),
    marketConfidence: 'medium',
  };
}

function scoreAnalysis(config: ResilienceConfig, results: RecoveryResult[]): ResilienceScores {
  const resilience = average(results.map((result) => result.recoveryProbability)) * 100;
  const equality =
    average(
      results.map(
        (result) => (result.economicRecoveryProbability + result.competitiveRecoveryProbability) / 2
      )
    ) * 100;
  const merit = config.payoutDirection === 'direct' ? 100 : 58;
  const liquidity = Math.min(
    100,
    (config.marketSlots / 20) * 68 + ((25 - config.rosterCap) / 15) * 32
  );
  const practicality = Math.max(
    0,
    100 - Math.abs(config.rosterCap - 18) * 2.5 - (config.rosterCap < 13 ? 20 : 0)
  );
  return {
    resilience,
    equality,
    merit,
    liquidity,
    practicality,
    overall:
      resilience * 0.4 + equality * 0.25 + merit * 0.1 + liquidity * 0.15 + practicality * 0.1,
  };
}

function analyzeConfiguration(
  simulationDataset: SeasonSimulationDataset,
  config: ResilienceConfig,
  shock: ShockConfig,
  runs = INTERACTIVE_SIMULATION_RUNS
): SeasonRecoveryAnalysis {
  const simulateFullSeason = (scenarioConfig: ResilienceConfig): RecoveryResult => {
    const summary =
      precomputedSimulation(scenarioConfig, shock) ||
      runSeasonMonteCarlo(simulationDataset, scenarioConfig, shock, {
        runs,
        baseSeed: 202526,
      });
    return { ...summary, config: scenarioConfig, shock };
  };
  const result = simulateFullSeason(config);
  const historicalResult = sameConfig(config, HISTORICAL_RESILIENCE_CONFIG)
    ? result
    : simulateFullSeason(HISTORICAL_RESILIENCE_CONFIG);
  return {
    config,
    shock,
    result,
    historicalResult,
    scores: scoreAnalysis(config, [result]),
    deltaRecoveryProbability: result.recoveryProbability - historicalResult.recoveryProbability,
    assumptions: [
      'Todos los escenarios comienzan con 40 M€ por usuario.',
      `${Math.min(result.simulationCount, historicalResult.simulationCount)} temporadas completas usan las mismas semillas para histórico y escenario.`,
      'Puntos y revalorizaciones se remuestrean por jugador desde trayectorias de 2025/26.',
      'Siete agentes con estrategias distintas pujan, venden, alinean y reciben primas.',
      'Las decisiones humanas se modelan estadísticamente; no son predicciones individuales.',
    ],
  };
}

function buildRecommendations(environment: RecoveryEnvironment): ResilienceRecommendation[] {
  const shocks: ShockConfig[] = [
    { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
    { kind: 'bad-streak', severity: 'medium', appliedRound: 5 },
    { kind: 'star-injury', severity: 'medium', appliedRound: 5 },
    { kind: 'inactivity', severity: 'medium', appliedRound: 5 },
  ];
  const candidates: Array<{
    config: ResilienceConfig;
    scores: ResilienceScores;
    results: RecoveryResult[];
  }> = [];

  if (simulationArtifact.status === 'ready') {
    const grouped = new Map<string, { config: ResilienceConfig; results: RecoveryResult[] }>();
    simulationArtifact.results.forEach((entry) => {
      if (!shocks.some((shock) => sameShock(shock, entry.shock))) return;
      const key = JSON.stringify(entry.config);
      const group = grouped.get(key) || { config: entry.config, results: [] };
      group.results.push({ ...entry.result, config: entry.config, shock: entry.shock });
      grouped.set(key, group);
    });
    grouped.forEach(({ config, results }) => {
      if (results.length !== shocks.length) return;
      candidates.push({ config, results, scores: scoreAnalysis(config, results) });
    });
  }

  if (!candidates.length) {
    for (let rosterCap = 10; rosterCap <= 25; rosterCap += 1) {
      (['inverse', 'direct'] as const).forEach((payoutDirection) => {
        [7_500, 10_000].forEach((eurosPerPoint) => {
          [10, 15, 20].forEach((marketSlots) => {
            const config = { rosterCap, payoutDirection, eurosPerPoint, marketSlots };
            const results = shocks.map((shock, index) =>
              simulateRecovery(environment, config, shock, 202526 + index)
            );
            candidates.push({ config, results, scores: scoreAnalysis(config, results) });
          });
        });
      });
    }
  }

  const profiles: Array<{
    id: ResilienceRecommendation['id'];
    name: string;
    description: string;
    weights: Omit<ResilienceScores, 'overall'>;
  }> = [
    {
      id: 'resilience',
      name: 'Máxima resiliencia',
      description: 'Prioriza que una mala decisión temprana no bloquee el resto de la temporada.',
      weights: {
        resilience: 0.48,
        equality: 0.27,
        merit: 0.03,
        liquidity: 0.14,
        practicality: 0.08,
      },
    },
    {
      id: 'balanced',
      name: 'Equilibrio competitivo',
      description: 'Mantiene premio por acertar, pero exige que el mercado permita reconstruir.',
      weights: {
        resilience: 0.32,
        equality: 0.2,
        merit: 0.22,
        liquidity: 0.13,
        practicality: 0.13,
      },
    },
    {
      id: 'merit',
      name: 'Mayor mérito',
      description: 'Recompensa el rendimiento conservando una red mínima frente a errores graves.',
      weights: {
        resilience: 0.16,
        equality: 0.1,
        merit: 0.5,
        liquidity: 0.09,
        practicality: 0.15,
      },
    },
  ];

  return profiles.map((profile) => {
    const weighted = candidates
      .map((candidate) => ({
        ...candidate,
        value: (Object.keys(profile.weights) as Array<keyof typeof profile.weights>).reduce(
          (sum, key) => sum + candidate.scores[key] * profile.weights[key],
          0
        ),
      }))
      .sort(
        (left, right) =>
          right.value - left.value || right.scores.practicality - left.scores.practicality
      );
    const winner = weighted[0];
    const runnerUp = weighted[1];
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      config: winner.config,
      scores: { ...winner.scores, overall: winner.value },
      averageRecoveryProbability: average(
        winner.results.map((result) => result.recoveryProbability)
      ),
      worstCaseRecoveryProbability: Math.min(
        ...winner.results.map((result) => result.recoveryProbability)
      ),
      averageLockInProbability: average(winner.results.map((result) => result.lockInProbability)),
      runnerUp: runnerUp.config,
      modelVersion: winner.results[0].modelVersion,
      simulationCount: Math.min(...winner.results.map((result) => result.simulationCount)),
    };
  });
}

async function buildResilienceModel() {
  const raw = await getSeasonReviewRawData();
  const { input, roundDateById } = normalizeLedgerInput(raw);
  const ledger = buildEconomicLedger(input);
  const capDiagnostics = analyzeRosterCaps(
    ledger,
    Array.from({ length: 16 }, (_, index) => 10 + index)
  );
  const environment = buildEnvironment(raw, capDiagnostics);
  const simulationDataset = buildSeasonSimulationDataset(raw);
  return {
    raw,
    input,
    ledger,
    capDiagnostics,
    environment,
    simulationDataset,
    roundDateById,
  };
}

const getCachedResilienceModel = () =>
  cached('season-review:resilience-model:2025-26:v3', CACHE_TTL.VERY_LONG, buildResilienceModel);

async function buildOverview(): Promise<SeasonReviewOverviewV2> {
  const { raw, input, ledger, capDiagnostics, environment, simulationDataset, roundDateById } =
    await getCachedResilienceModel();
  const colors = new Map(
    raw.users.map((user, index) => [
      user.id,
      USER_COLORS[Number(user.color_index) % USER_COLORS.length] || USER_COLORS[index],
    ])
  );
  const bidTransfers = new Set(raw.transferBids.map((bid) => Number(bid.transfer_id)));
  const marketCoverageStart = raw.marketListingPlayers[0]?.listed_at
    ? dayOf(raw.marketListingPlayers[0].listed_at)
    : null;
  const timeline = buildTimeline(ledger, colors);
  const closing = timeline.at(-1);
  const initialAnalysis = analyzeConfiguration(
    simulationDataset,
    HISTORICAL_RESILIENCE_CONFIG,
    DEFAULT_RECOVERY_SHOCK
  );
  const simulationCalibration = calibrateSeasonSimulator(
    {
      transfers: raw.counts.transfers,
      finalResourceGini: closing?.resourceGini || 0,
      finalSquadGini: closing?.squadGini || 0,
    },
    {
      medianTransactions: initialAnalysis.result.medianTransactions || 0,
      medianFinalResourceGini: initialAnalysis.result.medianFinalResourceGini || 0,
      medianFinalSquadGini: initialAnalysis.result.medianFinalSquadGini || 0,
    }
  );
  return {
    version: 2,
    seasonId: REVIEW_SEASON_ID,
    startingBudget: STARTING_BUDGET,
    openingRosterSize: Math.round(input.initialSquads.length / Math.max(1, input.users.length)),
    users: raw.users.map((user) => ({
      id: user.id,
      name: user.name,
      color: colors.get(user.id) || '#94a3b8',
    })),
    timeline,
    autopsy: buildAutopsy(raw, ledger, roundDateById, colors),
    capDiagnostics,
    recommendations: buildRecommendations(environment),
    historicalConfig: HISTORICAL_RESILIENCE_CONFIG,
    defaultShock: DEFAULT_RECOVERY_SHOCK,
    initialAnalysis,
    simulationCalibration,
    quality: {
      rawFinanceRows: raw.counts.rawFinanceRows,
      uniqueFinanceEvents: raw.counts.uniqueFinanceEvents,
      transfers: raw.counts.transfers,
      bids: raw.transferBids.length,
      transfersWithBids: bidTransfers.size,
      marketSnapshotDays: raw.counts.marketSnapshotDays,
      marketCoverageStart,
      balanceSnapshots: false,
      salaryHistory: false,
      warnings: [
        'El saldo se reconstruye desde 40 M€; no existen snapshots históricos de saldo.',
        'Las primas se deduplican y se mantienen separadas de fichajes y revalorizaciones.',
        'Las temporadas completas remuestrean trayectorias reales y enfrentan siete estrategias de agente.',
        'Las pujas y decisiones contrafactuales son comportamiento modelado, no predicciones individuales.',
        'Los snapshots completos de mercado comienzan en marzo; antes se usan fichajes y pujas observadas.',
      ],
    },
    generatedAt: new Date().toISOString(),
  };
}

export const getSeasonResilienceOverview = () =>
  cached('season-review:resilience-overview:2025-26:v3', CACHE_TTL.VERY_LONG, buildOverview);

export async function simulateSeasonResilience(input: unknown) {
  const request = resilienceRequestSchema.parse(input);
  const cacheKey = `season-review:resilience-simulation:v3:${JSON.stringify(request)}`;
  return cached(cacheKey, CACHE_TTL.VERY_LONG, async () => {
    const { simulationDataset } = await getCachedResilienceModel();
    return analyzeConfiguration(simulationDataset, request.config, request.shock);
  });
}
