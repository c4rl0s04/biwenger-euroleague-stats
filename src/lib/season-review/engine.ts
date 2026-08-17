import { z } from 'zod';
import type {
  RecommendationProfile,
  ReviewRound,
  ScenarioConfig,
  ScenarioResult,
  ScoreBreakdown,
  SeasonReviewDataset,
  UserScenarioResult,
} from './types';

const moneyOptions = [0, 50000, 60000, 100000, 150000] as const;

export const scenarioConfigSchema = z.object({
  rosterCap: z.union([z.literal(18), z.literal(20), z.literal(22), z.literal(25)]),
  payoutMode: z.enum(['inverse', 'direct', 'hybrid', 'equal']),
  eurosPerPoint: z.union([z.literal(5000), z.literal(7500), z.literal(10000)]),
  meritWeight: z.union([
    z.literal(0),
    z.literal(0.25),
    z.literal(0.5),
    z.literal(0.75),
    z.literal(1),
  ]),
  positionPreset: z.enum([
    'none',
    'winner',
    'podium-light',
    'podium-strong',
    'bottom-support',
    'custom',
  ]),
  positionBonuses: z.array(z.number().int().min(0).max(5000000)).length(7),
  idealPlayerBonus: z.union([
    z.literal(moneyOptions[0]),
    z.literal(moneyOptions[1]),
    z.literal(moneyOptions[3]),
  ]),
  mvpBonus: z.union([
    z.literal(moneyOptions[0]),
    z.literal(moneyOptions[2]),
    z.literal(moneyOptions[4]),
  ]),
  stackMvpAndIdeal: z.boolean(),
  marketSlots: z.union([z.literal(10), z.literal(15), z.literal(20), z.literal(25), z.literal(30)]),
  squadValueCap: z.union([
    z.null(),
    z.literal(70000000),
    z.literal(80000000),
    z.literal(90000000),
    z.literal(100000000),
    z.literal(110000000),
  ]),
  budgetMode: z.enum(['literal', 'neutral']),
});

export const DEFAULT_SCENARIO: ScenarioConfig = {
  rosterCap: 25,
  payoutMode: 'inverse',
  eurosPerPoint: 10000,
  meritWeight: 0,
  positionPreset: 'none',
  positionBonuses: [0, 0, 0, 0, 0, 0, 0],
  idealPlayerBonus: 0,
  mvpBonus: 0,
  stackMvpAndIdeal: true,
  marketSlots: 20,
  squadValueCap: null,
  budgetMode: 'literal',
};

export const POSITION_PRESETS: Record<ScenarioConfig['positionPreset'], number[]> = {
  none: [0, 0, 0, 0, 0, 0, 0],
  winner: [500000, 0, 0, 0, 0, 0, 0],
  'podium-light': [300000, 200000, 100000, 0, 0, 0, 0],
  'podium-strong': [750000, 500000, 250000, 0, 0, 0, 0],
  'bottom-support': [0, 0, 0, 0, 100000, 200000, 300000],
  custom: [0, 0, 0, 0, 0, 0, 0],
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const roundMoney = (value: number) => Math.max(0, Math.round(value));

export function gini(values: number[]): number {
  if (values.length === 0) return 0;
  const min = Math.min(...values);
  const shifted = min < 0 ? values.map((value) => value - min) : values;
  const sorted = [...shifted].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;
  const weighted = sorted.reduce((sum, value, index) => sum + (index + 1) * value, 0);
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}

export function coefficientOfVariation(values: number[]): number {
  if (!values.length) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / Math.abs(mean);
}

export function pearson(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length < 2) return 0;
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let numerator = 0;
  let leftDenominator = 0;
  let rightDenominator = 0;
  left.forEach((value, index) => {
    const leftDelta = value - leftMean;
    const rightDelta = right[index] - rightMean;
    numerator += leftDelta * rightDelta;
    leftDenominator += leftDelta ** 2;
    rightDenominator += rightDelta ** 2;
  });
  if (!leftDenominator || !rightDenominator) return 0;
  return numerator / Math.sqrt(leftDenominator * rightDenominator);
}

interface RankedRoundUser {
  userId: string;
  points: number;
  inversePoints: number;
  rankStart: number;
  rankEnd: number;
}

export function rankRound(round: ReviewRound): RankedRoundUser[] {
  const sorted = round.users
    .filter((entry) => entry.participated)
    .map((entry) => ({ userId: entry.userId, points: entry.points }))
    .sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId));
  const ascendingPoints = sorted.map((entry) => entry.points).reverse();

  return sorted.map((entry, index) => {
    const tiedIndexes = sorted
      .map((candidate, candidateIndex) => ({ candidate, candidateIndex }))
      .filter(({ candidate }) => candidate.points === entry.points)
      .map(({ candidateIndex }) => candidateIndex);
    const inversePoints =
      tiedIndexes.reduce((sum, tiedIndex) => sum + ascendingPoints[tiedIndex], 0) /
      tiedIndexes.length;
    return {
      ...entry,
      inversePoints,
      rankStart: Math.min(...tiedIndexes),
      rankEnd: Math.max(...tiedIndexes),
    };
  });
}

export function splitPositionBonuses(
  ranked: RankedRoundUser[],
  configuredBonuses: number[]
): Map<string, number> {
  const result = new Map<string, number>();
  ranked.forEach((entry) => {
    const tied = ranked.filter((candidate) => candidate.points === entry.points);
    const pool = configuredBonuses
      .slice(entry.rankStart, entry.rankEnd + 1)
      .reduce((sum, value) => sum + value, 0);
    result.set(entry.userId, tied.length ? pool / tied.length : 0);
  });
  return result;
}

function basePoints(entry: RankedRoundUser, config: ScenarioConfig, roundAverage: number) {
  if (config.payoutMode === 'equal') return roundAverage;
  if (config.payoutMode === 'direct') return entry.points;
  if (config.payoutMode === 'inverse') return entry.inversePoints;
  return entry.inversePoints * (1 - config.meritWeight) + entry.points * config.meritWeight;
}

interface RawPayoutRow {
  userId: string;
  base: number;
  position: number;
  ideal: number;
  mvp: number;
  porra: number;
  recorded: number;
  points: number;
}

function calculateRawPayouts(dataset: SeasonReviewDataset, config: ScenarioConfig): RawPayoutRow[] {
  const rows: RawPayoutRow[] = [];
  const bonuses =
    config.positionPreset === 'custom'
      ? config.positionBonuses
      : POSITION_PRESETS[config.positionPreset];

  dataset.rounds.forEach((round) => {
    const ranked = rankRound(round);
    const positionPayouts = splitPositionBonuses(ranked, bonuses);
    const roundAverage = ranked.reduce((sum, entry) => sum + entry.points, 0) / ranked.length;
    const rankedById = new Map(ranked.map((entry) => [entry.userId, entry]));

    round.users.forEach((entry) => {
      const ranking = rankedById.get(entry.userId);
      if (!entry.participated || !ranking) return;
      const idealHitsPaid = config.stackMvpAndIdeal
        ? entry.idealHits
        : Math.max(0, entry.idealHits - entry.mvpHits);
      rows.push({
        userId: entry.userId,
        base: basePoints(ranking, config, roundAverage) * config.eurosPerPoint,
        position: positionPayouts.get(entry.userId) || 0,
        ideal: idealHitsPaid * config.idealPlayerBonus,
        mvp: entry.mvpHits * config.mvpBonus,
        porra: entry.porraResidual,
        recorded: entry.recordedBonus,
        points: entry.points,
      });
    });
  });

  if (config.budgetMode === 'neutral') {
    const target = Math.max(0, dataset.baselineRecordedPayout - dataset.baselinePorraResidual);
    const configurableTotal = rows.reduce(
      (sum, row) => sum + row.base + row.position + row.ideal + row.mvp,
      0
    );
    const factor = configurableTotal > 0 ? target / configurableTotal : 0;
    rows.forEach((row) => {
      row.base *= factor;
      row.position *= factor;
      row.ideal *= factor;
      row.mvp *= factor;
    });
  }

  return rows;
}

function breachMetrics(values: number[], cap: number | null) {
  if (!cap || !values.length) return { rate: 0, maxExcess: 0 };
  const breaches = values.filter((value) => value > cap);
  return {
    rate: breaches.length / values.length,
    maxExcess: breaches.length ? Math.max(...breaches.map((value) => value - cap)) : 0,
  };
}

function scoreScenario(
  config: ScenarioConfig,
  users: UserScenarioResult[],
  rosterBreachRate: number,
  valueCapBreachRate: number,
  totalPlayers: number
): ScoreBreakdown {
  const resources = users.map((user) => user.estimatedResources);
  const payouts = users.map((user) => user.totalPayout);
  const points = users.map((user) => user.points);
  const resourceGini = gini(resources);
  const payoutMeritCorrelation = pearson(payouts, points);
  const resourcePerformanceCorrelation = Math.abs(pearson(resources, points));
  const expectedWait = Math.ceil(totalPlayers / config.marketSlots);
  const complexity =
    (config.payoutMode === 'hybrid' ? 12 : 0) +
    (config.positionPreset !== 'none' ? 10 : 0) +
    (config.idealPlayerBonus > 0 ? 5 : 0) +
    (config.mvpBonus > 0 ? 5 : 0) +
    (config.squadValueCap ? 8 : 0);
  const intervention = (rosterBreachRate + valueCapBreachRate) * 35;

  return {
    equality: clamp((1 - resourceGini) * 100),
    competitiveness: clamp(100 - resourcePerformanceCorrelation * 70 - resourceGini * 30),
    merit: clamp((payoutMeritCorrelation + 1) * 50),
    liquidity: clamp(100 - Math.max(0, expectedWait - 8) * 4 + (25 - config.rosterCap) * 2),
    practicality: clamp(100 - complexity - intervention),
  };
}

function percentile(values: number[], fraction: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function bootstrapIntervals(dataset: SeasonReviewDataset, config: ScenarioConfig) {
  if (!dataset.rounds.length) {
    return { totalPayout: { low: 0, high: 0 }, gini: { low: 0, high: 0 } };
  }
  const random = mulberry32(202526);
  const totals: number[] = [];
  const ginis: number[] = [];
  for (let iteration = 0; iteration < 1000; iteration += 1) {
    const rounds = Array.from({ length: dataset.rounds.length }, () => {
      const index = Math.floor(random() * dataset.rounds.length);
      return dataset.rounds[index];
    });
    const sampled = { ...dataset, rounds };
    const rows = calculateRawPayouts(sampled, config);
    const byUser = new Map<string, number>();
    rows.forEach((row) => {
      byUser.set(
        row.userId,
        (byUser.get(row.userId) || 0) + row.base + row.position + row.ideal + row.mvp + row.porra
      );
    });
    const values = Array.from(byUser.values());
    totals.push(values.reduce((sum, value) => sum + value, 0));
    ginis.push(gini(values));
  }
  return {
    totalPayout: { low: percentile(totals, 0.05), high: percentile(totals, 0.95) },
    gini: { low: percentile(ginis, 0.05), high: percentile(ginis, 0.95) },
  };
}

export function simulateScenario(
  dataset: SeasonReviewDataset,
  input: ScenarioConfig,
  options: { bootstrap?: boolean } = {}
): ScenarioResult {
  const config = scenarioConfigSchema.parse(input);
  const rows = calculateRawPayouts(dataset, config);
  const userRows = new Map<string, UserScenarioResult>();

  dataset.users.forEach((user) => {
    const rosterAdjustment = Math.min(1, config.rosterCap / Math.max(1, user.finalRosterSize));
    const rosterAdjustedValue = user.finalSquadValue * rosterAdjustment;
    const constrainedSquadValue = config.squadValueCap
      ? Math.min(rosterAdjustedValue, config.squadValueCap)
      : rosterAdjustedValue;
    userRows.set(user.id, {
      userId: user.id,
      name: user.name,
      points: 0,
      basePayout: 0,
      positionPayout: 0,
      idealPayout: 0,
      mvpPayout: 0,
      porraPayout: 0,
      totalPayout: 0,
      baselinePayout: 0,
      delta: 0,
      estimatedResources: constrainedSquadValue + user.marketNet,
    });
  });

  rows.forEach((row) => {
    const user = userRows.get(row.userId);
    if (!user) return;
    user.points += row.points;
    user.basePayout += row.base;
    user.positionPayout += row.position;
    user.idealPayout += row.ideal;
    user.mvpPayout += row.mvp;
    user.porraPayout += row.porra;
    user.baselinePayout += row.recorded;
  });

  const users = Array.from(userRows.values()).map((user) => {
    const totalPayout = roundMoney(
      user.basePayout + user.positionPayout + user.idealPayout + user.mvpPayout + user.porraPayout
    );
    return {
      ...user,
      basePayout: roundMoney(user.basePayout),
      positionPayout: roundMoney(user.positionPayout),
      idealPayout: roundMoney(user.idealPayout),
      mvpPayout: roundMoney(user.mvpPayout),
      porraPayout: roundMoney(user.porraPayout),
      totalPayout,
      delta: totalPayout - user.baselinePayout,
      estimatedResources: user.estimatedResources + totalPayout,
    };
  });
  const baselineResources = dataset.users.map((user) => {
    const payout = users.find((candidate) => candidate.userId === user.id)?.baselinePayout || 0;
    return user.finalSquadValue + user.marketNet + payout;
  });
  const roster = breachMetrics(dataset.structural.rosterSizes, config.rosterCap);
  const value = breachMetrics(dataset.structural.squadValues, config.squadValueCap);
  const totalPayout = users.reduce((sum, user) => sum + user.totalPayout, 0);
  const resources = users.map((user) => user.estimatedResources);
  const positiveResources = resources.filter((resource) => resource > 0).sort((a, b) => a - b);
  const confidence =
    config.marketSlots !== 20 || config.squadValueCap || config.rosterCap !== 25
      ? config.marketSlots !== 20
        ? 'low'
        : 'medium'
      : 'high';

  const result: ScenarioResult = {
    config,
    users: users.sort((a, b) => b.estimatedResources - a.estimatedResources),
    scores: scoreScenario(config, users, roster.rate, value.rate, dataset.structural.totalPlayers),
    totalPayout,
    baselinePayout: dataset.baselineRecordedPayout,
    inflation:
      dataset.baselineRecordedPayout > 0 ? totalPayout / dataset.baselineRecordedPayout - 1 : 0,
    gini: gini(resources),
    baselineGini: gini(baselineResources),
    coefficientOfVariation: coefficientOfVariation(resources),
    resourceRatio:
      positiveResources.length > 1
        ? positiveResources[positiveResources.length - 1] / positiveResources[0]
        : 1,
    rosterBreachRate: roster.rate,
    rosterMaxExcess: roster.maxExcess,
    valueCapBreachRate: value.rate,
    valueCapMaxExcess: value.maxExcess,
    expectedMarketWaitDays: Math.ceil(dataset.structural.totalPlayers / config.marketSlots),
    confidence,
  };

  if (options.bootstrap) result.intervals = bootstrapIntervals(dataset, config);
  return result;
}

export const PROFILE_DEFINITIONS: Array<Omit<RecommendationProfile, 'winner' | 'runnerUp'>> = [
  {
    id: 'equality',
    name: 'Máxima igualdad',
    description: 'Reduce la distancia económica y facilita que los últimos recuperen terreno.',
    weights: {
      equality: 0.5,
      competitiveness: 0.2,
      merit: 0.05,
      liquidity: 0.15,
      practicality: 0.1,
    },
  },
  {
    id: 'balanced',
    name: 'Equilibrio competitivo',
    description: 'Mantiene incentivos deportivos sin alimentar una ventaja económica irreversible.',
    weights: {
      equality: 0.3,
      competitiveness: 0.25,
      merit: 0.2,
      liquidity: 0.15,
      practicality: 0.1,
    },
  },
  {
    id: 'merit',
    name: 'Premiar rendimiento',
    description:
      'Recompensa con claridad los puntos, las posiciones y las decisiones de alineación.',
    weights: {
      equality: 0.15,
      competitiveness: 0.2,
      merit: 0.45,
      liquidity: 0.1,
      practicality: 0.1,
    },
  },
];

export function weightedScore(result: ScenarioResult, weights: ScoreBreakdown) {
  return (Object.keys(weights) as Array<keyof ScoreBreakdown>).reduce(
    (sum, key) => sum + result.scores[key] * weights[key],
    0
  );
}

export function isParetoDominated(candidate: ScenarioResult, pool: ScenarioResult[]) {
  const keys: Array<keyof ScoreBreakdown> = [
    'equality',
    'competitiveness',
    'merit',
    'liquidity',
    'practicality',
  ];
  return pool.some(
    (other) =>
      other !== candidate &&
      keys.every((key) => other.scores[key] >= candidate.scores[key]) &&
      keys.some((key) => other.scores[key] > candidate.scores[key])
  );
}
