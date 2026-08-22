import { simulateSeason } from './season-simulator';
import {
  EMERGENT_PAYOUT_AMOUNTS,
  type EmergentCap15Analysis,
  type EmergentConfigurationReport,
  type EmergentDimensionScores,
  type EmergentDistribution,
  type EmergentRankingEntry,
  type EmergentRunDetail,
  type EmergentRunSample,
  type EmergentRunSummary,
  type EmergentSeasonRequest,
  type EmergentSimulationConfig,
} from './emergent-types';

export const EMERGENT_BASE_RUNS = 2_048;
export const EMERGENT_FINALIST_RUNS = 8_192;

export function emergentSeedForRun(runIndex: number) {
  if (!Number.isInteger(runIndex) || runIndex < 0)
    throw new Error('V5 run index must be a non-negative integer');
  return 202_526 + runIndex * 7_919;
}

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function quantile(sorted: number[], fraction: number) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function median(values: number[]) {
  return quantile(
    [...values].sort((left, right) => left - right),
    0.5
  );
}

function distribution(values: number[]): EmergentDistribution {
  const safe = values.map((value) => (Number.isFinite(value) ? value : 0));
  const sorted = [...safe].sort((left, right) => left - right);
  const mean = average(safe);
  const standardDeviation = safe.length
    ? Math.sqrt(average(safe.map((value) => (value - mean) ** 2)))
    : 0;
  const margin = safe.length ? (1.96 * standardDeviation) / Math.sqrt(safe.length) : 0;
  return {
    mean,
    median: quantile(sorted, 0.5),
    standardDeviation,
    min: sorted[0] || 0,
    max: sorted.at(-1) || 0,
    quantiles: {
      p05: quantile(sorted, 0.05),
      p25: quantile(sorted, 0.25),
      p50: quantile(sorted, 0.5),
      p75: quantile(sorted, 0.75),
      p95: quantile(sorted, 0.95),
    },
    interval95: [mean - margin, mean + margin],
  };
}

function correlation(left: number[], right: number[]) {
  if (!left.length || left.length !== right.length) return 0;
  const leftMean = average(left);
  const rightMean = average(right);
  const numerator = left.reduce(
    (sum, value, index) => sum + (value - leftMean) * (right[index] - rightMean),
    0
  );
  const denominator = Math.sqrt(
    left.reduce((sum, value) => sum + (value - leftMean) ** 2, 0) *
      right.reduce((sum, value) => sum + (value - rightMean) ** 2, 0)
  );
  return denominator ? numerator / denominator : 0;
}

function gap(values: number[]) {
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

function rankIds(point: EmergentRunDetail['timeline'][number]) {
  return [...point.users]
    .sort((left, right) => right.points - left.points || left.userId.localeCompare(right.userId))
    .map((user) => user.userId);
}

function leadChanges(run: EmergentRunDetail) {
  let previous = '';
  let changes = 0;
  run.timeline.slice(1).forEach((point) => {
    const leader = rankIds(point)[0] || '';
    if (previous && previous !== leader) changes += 1;
    previous = leader;
  });
  return changes;
}

function rankMobility(run: EmergentRunDetail) {
  const rankings = run.timeline.slice(1).map(rankIds);
  if (rankings.length < 2) return 0;
  let movement = 0;
  for (let index = 1; index < rankings.length; index += 1) {
    rankings[index].forEach((userId, rank) => {
      movement += Math.abs(rankings[index - 1].indexOf(userId) - rank);
    });
  }
  return movement / ((rankings.length - 1) * Math.max(1, rankings[0].length));
}

function bottomPersistence(run: EmergentRunDetail, horizon: number) {
  const shares: number[] = [];
  for (let index = 1; index + horizon < run.timeline.length; index += 1) {
    const current = new Set(rankIds(run.timeline[index]).slice(-2));
    const future = new Set(rankIds(run.timeline[index + horizon]).slice(-2));
    shares.push(Array.from(current).filter((id) => future.has(id)).length / current.size);
  }
  return average(shares);
}

function naturalRecovery(run: EmergentRunDetail) {
  let episodes = 0;
  let withinFive = 0;
  let withinTen = 0;
  let withinTwenty = 0;
  const active = new Set<string>();
  for (let index = 1; index < run.timeline.length; index += 1) {
    const point = run.timeline[index];
    const bottom = new Set(rankIds(point).slice(-2));
    const medianResources = median(point.users.map((user) => user.totalResources));
    const medianStrength = median(point.users.map((user) => user.competitiveStrength));
    point.users.forEach((user) => {
      const isLagging =
        bottom.has(user.userId) &&
        (user.totalResources < medianResources * 0.85 ||
          user.competitiveStrength < medianStrength * 0.85);
      if (!isLagging || active.has(user.userId)) return;
      active.add(user.userId);
      episodes += 1;
      let recoveredAt: number | null = null;
      for (let futureIndex = index + 1; futureIndex < run.timeline.length; futureIndex += 1) {
        let streak = 0;
        for (
          let check = futureIndex;
          check < Math.min(run.timeline.length, futureIndex + 3);
          check += 1
        ) {
          const future = run.timeline[check];
          const candidate = future.users.find((row) => row.userId === user.userId);
          const resources = median(future.users.map((row) => row.totalResources));
          const strength = median(future.users.map((row) => row.competitiveStrength));
          if (
            candidate &&
            candidate.totalResources >= resources * 0.95 &&
            candidate.competitiveStrength >= strength * 0.95
          )
            streak += 1;
        }
        if (streak === 3) {
          recoveredAt = futureIndex - index + 2;
          break;
        }
      }
      if (recoveredAt != null) {
        if (recoveredAt <= 5) withinFive += 1;
        if (recoveredAt <= 10) withinTen += 1;
        if (recoveredAt <= 20) withinTwenty += 1;
      }
    });
  }
  return {
    episodes,
    withinFiveRounds: episodes ? withinFive / episodes : 0,
    withinTenRounds: episodes ? withinTen / episodes : 0,
    withinTwentyRounds: episodes ? withinTwenty / episodes : 0,
    bottomPersistenceFive: bottomPersistence(run, 5),
    bottomPersistenceTen: bottomPersistence(run, 10),
    bottomPersistenceTwenty: bottomPersistence(run, 20),
  };
}

function antiHoarding(run: EmergentRunDetail) {
  const concentrations: number[] = [];
  const diversities: number[] = [];
  const benchShares: number[] = [];
  run.timeline.slice(1).forEach((point) => {
    const owned = point.users.flatMap((user) =>
      user.rosterPlayers.map((player) => ({ ...player, userId: user.userId }))
    );
    const top = [...owned]
      .sort((left, right) => right.projectedPoints - left.projectedPoints)
      .slice(0, Math.max(1, Math.ceil(owned.length * 0.2)));
    const counts = new Map<string, number>();
    top.forEach((player) => counts.set(player.userId, (counts.get(player.userId) || 0) + 1));
    concentrations.push(Math.max(0, ...Array.from(counts.values())) / top.length);
    diversities.push(
      new Set(top.map((player) => player.userId)).size / Math.min(point.users.length, top.length)
    );
    point.users.forEach((user) => {
      const total = user.rosterPlayers.reduce((sum, player) => sum + player.projectedPoints, 0);
      const lineup = new Set(user.lineupPlayerIds);
      const bench = user.rosterPlayers
        .filter((player) => !lineup.has(player.playerId))
        .reduce((sum, player) => sum + player.projectedPoints, 0);
      benchShares.push(total ? bench / total : 0);
    });
  });
  return {
    topTalentConcentration: average(concentrations),
    ownershipDiversity: average(diversities),
    benchTalentShare: average(benchShares),
  };
}

function liquidity(run: EmergentRunDetail) {
  const buys = run.transactions.filter((transaction) => transaction.type === 'buy');
  let laggardBuys = 0;
  buys.forEach((transaction) => {
    const point = run.timeline[Math.max(0, transaction.round - 1)];
    if (rankIds(point).slice(-2).includes(transaction.userId)) laggardBuys += 1;
  });
  return {
    transactions: run.transactions.length,
    uniquePlayersTraded: new Set(run.transactions.map((transaction) => transaction.playerId)).size,
    marketCoverage:
      new Set(run.marketListings.map((listing) => listing.playerId)).size /
      Math.max(1, run.catalogSize),
    averageBidders: average(run.marketListings.map((listing) => listing.bidCount)),
    laggardAcquisitionShare: buys.length ? laggardBuys / buys.length : 0,
  };
}

function roundToGap(run: EmergentRunDetail, threshold: number) {
  return (
    run.timeline.find((point) => gap(point.users.map((user) => user.totalResources)) >= threshold)
      ?.round ?? run.timeline.length
  );
}

export function generateEmergentConfigurationGrid(): EmergentSimulationConfig[] {
  const configurations: EmergentSimulationConfig[] = [];
  for (let rosterCap = 10; rosterCap <= 25; rosterCap += 1) {
    for (const eurosPerPoint of EMERGENT_PAYOUT_AMOUNTS) {
      configurations.push({
        configId: `s${rosterCap}-m20-inverse-${eurosPerPoint}`,
        rosterCap,
        marketSlots: 20,
        payoutDirection: 'inverse',
        eurosPerPoint,
      });
    }
  }
  return configurations;
}

export function simulateEmergentSeason(request: EmergentSeasonRequest): EmergentRunDetail {
  const outcome = simulateSeason({
    dataset: request.dataset,
    config: request.config,
    seed: request.seed,
    shockEnabled: false,
    // The V4 core still accepts a shock descriptor, but shockEnabled=false makes it inert.
    shock: { kind: 'bad-transfer', severity: 'low', appliedRound: 1 },
  });

  return {
    version: 5,
    modelVersion: 'agent-season-v5',
    runId: `run-${request.seed}`,
    seed: request.seed,
    config: request.config,
    profiles: outcome.profiles,
    timeline: outcome.timeline,
    transactions: outcome.transactions,
    marketListings: outcome.marketListings,
    catalogSize: outcome.catalogSize,
    openingForcedReleases: outcome.openingForcedReleases,
  };
}

export function summarizeEmergentRun(run: EmergentRunDetail): EmergentRunSummary {
  const closing = run.timeline.at(-1)?.users || [];
  const recovery = naturalRecovery(run);
  const antiHoardingMetrics = antiHoarding(run);
  const liquidityMetrics = liquidity(run);
  const champion = [...closing].sort(
    (left, right) => right.points - left.points || left.userId.localeCompare(right.userId)
  )[0];
  return {
    runId: run.runId,
    seed: run.seed,
    finalResourceGini: run.timeline.at(-1)?.resourceGini || 0,
    finalSquadGini: run.timeline.at(-1)?.squadGini || 0,
    finalResourceGap: gap(closing.map((user) => user.totalResources)),
    finalPointsGap: gap(closing.map((user) => user.points)),
    resourceInequalityArea: run.timeline.reduce((sum, point) => sum + point.resourceGini, 0),
    resourceGapArea: run.timeline.reduce(
      (sum, point) => sum + gap(point.users.map((user) => user.totalResources)),
      0
    ),
    roundToFiveMillionGap: roundToGap(run, 5_000_000),
    roundToTenMillionGap: roundToGap(run, 10_000_000),
    roundToTwentyMillionGap: roundToGap(run, 20_000_000),
    competitive: {
      averageContenders: average(run.timeline.slice(1).map((point) => point.titleContenders)),
      leadChanges: leadChanges(run),
      rankMobility: rankMobility(run),
    },
    naturalRecovery: recovery,
    antiHoarding: antiHoardingMetrics,
    liquidity: liquidityMetrics,
    merit: correlation(
      closing.map((user) => user.decisionQuality),
      closing.map((user) => user.points)
    ),
    totalBonuses: closing.reduce((sum, user) => sum + user.bonuses, 0),
    openingForcedReleases: run.openingForcedReleases,
    championProfileId: champion?.profileId || '',
  };
}

export function aggregateEmergentRuns(
  config: EmergentSimulationConfig,
  runs: EmergentRunDetail[]
): EmergentConfigurationReport {
  if (!runs.length) throw new Error('At least one emergent season is required');
  return aggregateEmergentSamples(config, runs.map(sampleEmergentRun));
}

export function sampleEmergentRun(run: EmergentRunDetail): EmergentRunSample {
  return {
    summary: summarizeEmergentRun(run),
    timeline: run.timeline.map((point) => ({
      round: point.round,
      resourceGini: point.resourceGini,
      squadGini: point.squadGini,
      resourceGap: gap(point.users.map((user) => user.totalResources)),
      pointsGap: gap(point.users.map((user) => user.points)),
      titleContenders: point.titleContenders,
    })),
  };
}

export function aggregateEmergentSamples(
  config: EmergentSimulationConfig,
  samples: EmergentRunSample[]
): EmergentConfigurationReport {
  if (!samples.length) throw new Error('At least one emergent season sample is required');
  const runSummaries = samples.map((sample) => sample.summary);
  const metric = (getter: (summary: EmergentRunSummary) => number) =>
    distribution(runSummaries.map(getter));
  return {
    version: 5,
    modelVersion: 'agent-season-v5',
    config,
    sampleSize: samples.length,
    metrics: {
      finalResourceGini: metric((row) => row.finalResourceGini),
      finalSquadGini: metric((row) => row.finalSquadGini),
      finalResourceGap: metric((row) => row.finalResourceGap),
      finalPointsGap: metric((row) => row.finalPointsGap),
      resourceInequalityArea: metric((row) => row.resourceInequalityArea),
      resourceGapArea: metric((row) => row.resourceGapArea),
      naturalRecoveryTen: metric((row) => row.naturalRecovery.withinTenRounds),
      bottomPersistenceTen: metric((row) => row.naturalRecovery.bottomPersistenceTen),
      topTalentConcentration: metric((row) => row.antiHoarding.topTalentConcentration),
      ownershipDiversity: metric((row) => row.antiHoarding.ownershipDiversity),
      benchTalentShare: metric((row) => row.antiHoarding.benchTalentShare),
      marketTransactions: metric((row) => row.liquidity.transactions),
      marketCoverage: metric((row) => row.liquidity.marketCoverage),
      laggardAcquisitionShare: metric((row) => row.liquidity.laggardAcquisitionShare),
      averageContenders: metric((row) => row.competitive.averageContenders),
      leadChanges: metric((row) => row.competitive.leadChanges),
      rankMobility: metric((row) => row.competitive.rankMobility),
      merit: metric((row) => row.merit),
      totalBonuses: metric((row) => row.totalBonuses),
      openingForcedReleases: metric((row) => row.openingForcedReleases),
    },
    timeline: samples[0].timeline.map((point, timelineIndex) => {
      const points = samples.map((sample) => sample.timeline[timelineIndex]);
      return {
        round: point.round,
        resourceGini: distribution(points.map((row) => row.resourceGini)),
        squadGini: distribution(points.map((row) => row.squadGini)),
        resourceGap: distribution(points.map((row) => row.resourceGap)),
        pointsGap: distribution(points.map((row) => row.pointsGap)),
        titleContenders: distribution(points.map((row) => row.titleContenders)),
      };
    }),
    runSummaries,
  };
}

function percentileMap(
  reports: EmergentConfigurationReport[],
  getter: (report: EmergentConfigurationReport) => number,
  higherIsBetter: boolean
) {
  const values = reports.map(getter);
  const sorted = [...values].sort((left, right) => left - right);
  return new Map(
    reports.map((report, index) => {
      const value = values[index];
      const first = sorted.indexOf(value);
      const last = sorted.lastIndexOf(value);
      const percentile = sorted.length <= 1 ? 50 : ((first + last) / 2 / (sorted.length - 1)) * 100;
      return [report.config.configId, higherIsBetter ? percentile : 100 - percentile];
    })
  );
}

function meanDimension(configId: string, maps: Array<Map<string, number>>) {
  return average(maps.map((map) => map.get(configId) || 0));
}

function mainDimensions(scores: EmergentDimensionScores) {
  return [
    scores.economicEquality,
    scores.competitiveBalance,
    scores.naturalRecovery,
    scores.antiHoarding,
    scores.liquidity,
  ];
}

export function buildEmergentRanking(
  reports: EmergentConfigurationReport[]
): EmergentRankingEntry[] {
  if (!reports.length) return [];
  const score = (
    getter: (report: EmergentConfigurationReport) => number,
    higherIsBetter: boolean
  ) => percentileMap(reports, getter, higherIsBetter);
  const equality = [
    score((row) => row.metrics.finalResourceGini.mean, false),
    score((row) => row.metrics.finalResourceGap.mean, false),
    score((row) => row.metrics.resourceInequalityArea.mean, false),
    score((row) => row.metrics.resourceGapArea.mean, false),
  ];
  const competitive = [
    score((row) => row.metrics.finalSquadGini.mean, false),
    score((row) => row.metrics.finalPointsGap.mean, false),
    score((row) => row.metrics.averageContenders.mean, true),
    score((row) => row.metrics.leadChanges.mean, true),
    score((row) => row.metrics.rankMobility.mean, true),
  ];
  const recovery = [
    score((row) => row.metrics.naturalRecoveryTen.mean, true),
    score((row) => row.metrics.bottomPersistenceTen.mean, false),
  ];
  const hoarding = [
    score((row) => row.metrics.topTalentConcentration.mean, false),
    score((row) => row.metrics.ownershipDiversity.mean, true),
    score((row) => row.metrics.benchTalentShare.mean, false),
  ];
  const liquidityScores = [
    score((row) => row.metrics.marketTransactions.mean, true),
    score((row) => row.metrics.marketCoverage.mean, true),
    score((row) => row.metrics.laggardAcquisitionShare.mean, true),
  ];
  const merit = [score((row) => row.metrics.merit.mean, true)];
  const inflation = [score((row) => row.metrics.totalBonuses.mean, false)];
  const practicality = [score((row) => row.metrics.openingForcedReleases.mean, false)];
  const rows = reports.map((report) => {
    const configId = report.config.configId;
    const dimensions: EmergentDimensionScores = {
      economicEquality: meanDimension(configId, equality),
      competitiveBalance: meanDimension(configId, competitive),
      naturalRecovery: meanDimension(configId, recovery),
      antiHoarding: meanDimension(configId, hoarding),
      liquidity: meanDimension(configId, liquidityScores),
      merit: meanDimension(configId, merit),
      inflationControl: meanDimension(configId, inflation),
      practicality: meanDimension(configId, practicality),
    };
    return {
      config: report.config,
      dimensions,
      balanceScore:
        dimensions.economicEquality * 0.25 +
        dimensions.competitiveBalance * 0.25 +
        dimensions.naturalRecovery * 0.25 +
        dimensions.antiHoarding * 0.15 +
        dimensions.liquidity * 0.1,
    };
  });
  const dominates = (left: EmergentDimensionScores, right: EmergentDimensionScores) => {
    const leftMain = mainDimensions(left);
    const rightMain = mainDimensions(right);
    return (
      leftMain.every((value, index) => value >= rightMain[index]) &&
      leftMain.some((value, index) => value > rightMain[index])
    );
  };
  return rows
    .map((row) => ({
      ...row,
      isParetoOptimal: !rows.some(
        (candidate) =>
          candidate.config.configId !== row.config.configId &&
          dominates(candidate.dimensions, row.dimensions)
      ),
    }))
    .sort(
      (left, right) =>
        right.balanceScore - left.balanceScore ||
        left.config.configId.localeCompare(right.config.configId)
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

export function selectEmergentFinalists(
  ranking: Omit<EmergentRankingEntry, never>[]
): EmergentSimulationConfig[] {
  if (ranking.length <= 24) return ranking.map((entry) => entry.config);
  const payoutMeans = new Map<number, number[]>();
  ranking.forEach((entry) => {
    const values = payoutMeans.get(entry.config.eurosPerPoint) || [];
    values.push(entry.balanceScore);
    payoutMeans.set(entry.config.eurosPerPoint, values);
  });
  const bestPayout = Array.from(payoutMeans.entries())
    .map(([payout, values]) => ({ payout, score: average(values) }))
    .sort((left, right) => right.score - left.score || left.payout - right.payout)[0].payout;
  const selected = new Map<string, EmergentSimulationConfig>();
  ranking
    .filter((entry) => entry.config.eurosPerPoint === bestPayout)
    .sort((left, right) => left.config.rosterCap - right.config.rosterCap)
    .forEach((entry) => selected.set(entry.config.configId, entry.config));
  EMERGENT_PAYOUT_AMOUNTS.filter((payout) => payout !== bestPayout).forEach((payout) => {
    const best = ranking.find((entry) => entry.config.eurosPerPoint === payout);
    if (best) selected.set(best.config.configId, best.config);
  });
  const historical = ranking.find((entry) => entry.config.configId === 's25-m20-inverse-10000');
  if (historical) selected.set(historical.config.configId, historical.config);
  [...ranking.filter((entry) => entry.isParetoOptimal), ...ranking].forEach((entry) => {
    if (selected.size < 24) selected.set(entry.config.configId, entry.config);
  });
  return Array.from(selected.values()).slice(0, 24);
}

export function buildCap15Analysis(
  ranking: EmergentRankingEntry[],
  summariesByConfig: Map<string, EmergentRunSummary[]>
): EmergentCap15Analysis[] {
  return EMERGENT_PAYOUT_AMOUNTS.map((eurosPerPoint) => {
    const family = ranking
      .filter((entry) => entry.config.eurosPerPoint === eurosPerPoint)
      .sort((left, right) => right.balanceScore - left.balanceScore);
    const cap15 = family.find((entry) => entry.config.rosterCap === 15);
    if (!cap15) return null;
    const cap15BySeed = new Map(
      (summariesByConfig.get(cap15.config.configId) || []).map((summary) => [summary.seed, summary])
    );
    const comparisons = family
      .filter((entry) => entry.config.rosterCap !== 15)
      .map((entry) => {
        const pairs = (summariesByConfig.get(entry.config.configId) || [])
          .map((other) => {
            const target = cap15BySeed.get(other.seed);
            return target ? { target, other } : null;
          })
          .filter((pair): pair is NonNullable<typeof pair> => Boolean(pair));
        const inequality = pairs.map(
          ({ target, other }) => target.resourceInequalityArea - other.resourceInequalityArea
        );
        return {
          comparedCap: entry.config.rosterCap,
          sampleSize: pairs.length,
          probabilityLowerInequality: pairs.length
            ? inequality.filter((value) => value < 0).length / pairs.length
            : 0,
          resourceInequalityDelta: distribution(inequality),
          talentConcentrationDelta: distribution(
            pairs.map(
              ({ target, other }) =>
                target.antiHoarding.topTalentConcentration -
                other.antiHoarding.topTalentConcentration
            )
          ),
          recoveryDelta: distribution(
            pairs.map(
              ({ target, other }) =>
                target.naturalRecovery.withinTenRounds - other.naturalRecovery.withinTenRounds
            )
          ),
        };
      })
      .sort((left, right) => left.comparedCap - right.comparedCap);
    const versus25 = comparisons.find((comparison) => comparison.comparedCap === 25);
    const balanceDeltaToBest = cap15.balanceScore - (family[0]?.balanceScore || 0);
    return {
      eurosPerPoint,
      bestCap: family[0]?.config.rosterCap || 15,
      cap15Rank: family.findIndex((entry) => entry.config.rosterCap === 15) + 1,
      isTopThree: family.slice(0, 3).some((entry) => entry.config.rosterCap === 15),
      isParetoOptimal: cap15.isParetoOptimal,
      balanceDeltaToBest,
      isRecommended:
        balanceDeltaToBest >= -3 &&
        Boolean(versus25 && versus25.talentConcentrationDelta.interval95[1] < 0),
      comparisons,
    };
  }).filter((row): row is EmergentCap15Analysis => Boolean(row));
}

export type {
  EmergentConfigurationReport,
  EmergentCap15Analysis,
  EmergentRankingEntry,
  EmergentRunDetail,
  EmergentRunSummary,
  EmergentSimulationConfig,
} from './emergent-types';
