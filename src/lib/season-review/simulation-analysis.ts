import type {
  ConfigurationSimulationAggregate,
  PairedSeasonOutcome,
  SimulationDistribution,
  SimulationGridConfig,
  SimulationDimensionScores,
  SimulationProfileRanking,
  SimulationProbabilityEstimate,
  SimulationRankingProfileId,
  SimulationRankingResult,
  SimulationRunSample,
  SimulationScenarioAggregate,
  SimulationSeasonPhase,
  SeasonSimulationRequest,
  SimulationSeedManifestEntry,
} from './simulation-types';
import type { ShockConfig } from './types';
import { simulateSeason } from './season-simulator';

const PAYOUT_AMOUNTS = [5_000, 7_500, 10_000] as const;
const PAYOUT_DIRECTIONS = ['direct', 'inverse'] as const;

export function generateConfigurationGrid(): SimulationGridConfig[] {
  const configurations: SimulationGridConfig[] = [];
  for (let rosterCap = 10; rosterCap <= 25; rosterCap += 1) {
    for (let marketSlots = 1; marketSlots <= 20; marketSlots += 1) {
      for (const payoutDirection of PAYOUT_DIRECTIONS) {
        for (const eurosPerPoint of PAYOUT_AMOUNTS) {
          configurations.push({
            configId: `s${rosterCap}-m${String(marketSlots).padStart(2, '0')}-${payoutDirection}-${eurosPerPoint}`,
            rosterCap,
            marketSlots,
            payoutDirection,
            eurosPerPoint,
          });
        }
      }
    }
  }
  return configurations;
}

const SHOCK_KINDS: ShockConfig['kind'][] = [
  'bad-transfer',
  'bad-streak',
  'star-injury',
  'inactivity',
];
const SHOCK_SEVERITIES: ShockConfig['severity'][] = ['low', 'medium', 'high'];
const SEASON_PHASES: SimulationSeasonPhase[] = ['early', 'first-third', 'midseason'];

export function generateSeedManifest(input: {
  pairs: number;
  baseSeed: number;
  rounds: number;
}): SimulationSeedManifestEntry[] {
  const pairs = Math.max(1, Math.floor(input.pairs));
  const rounds = Math.max(3, Math.floor(input.rounds));
  return Array.from({ length: pairs }, (_, index) => {
    const kind = SHOCK_KINDS[index % SHOCK_KINDS.length];
    const severity = SHOCK_SEVERITIES[index % SHOCK_SEVERITIES.length];
    const phase = SEASON_PHASES[Math.floor(index / SHOCK_SEVERITIES.length) % SEASON_PHASES.length];
    const appliedRound =
      phase === 'early'
        ? Math.min(5, rounds)
        : phase === 'first-third'
          ? Math.max(2, Math.round(rounds / 3))
          : Math.max(2, Math.round(rounds / 2));
    return {
      pairId: `pair-${String(index + 1).padStart(4, '0')}`,
      seed: input.baseSeed + index * 7_919,
      shock: { kind, severity, appliedRound },
      phase,
    };
  });
}

function userAt(outcome: PairedSeasonOutcome['baseline'], timelineIndex: number, userId: string) {
  return outcome.timeline[timelineIndex]?.users.find((user) => user.userId === userId);
}

export function simulatePairedSeason(input: {
  dataset: SeasonSimulationRequest['dataset'];
  config: SimulationGridConfig;
  manifest: SimulationSeedManifestEntry;
}): PairedSeasonOutcome {
  const commonRequest = {
    dataset: input.dataset,
    config: input.config,
    shock: input.manifest.shock,
    seed: input.manifest.seed,
  };
  const baseline = simulateSeason({ ...commonRequest, shockEnabled: false });
  const shocked = simulateSeason({ ...commonRequest, shockEnabled: true });
  const targetUserId = shocked.recovery.targetUserId;
  const losses = shocked.timeline.map((point, timelineIndex) => {
    const baselineUser = userAt(baseline, timelineIndex, targetUserId);
    const shockedUser = point.users.find((user) => user.userId === targetUserId);
    return {
      round: point.round,
      resource: Math.max(
        0,
        (baselineUser?.totalResources || 0) - (shockedUser?.totalResources || 0)
      ),
      competitive: Math.max(
        0,
        (baselineUser?.competitiveStrength || 0) - (shockedUser?.competitiveStrength || 0)
      ),
      points: Math.max(0, (baselineUser?.points || 0) - (shockedUser?.points || 0)),
      isNearTwin:
        (shockedUser?.totalResources || 0) >= (baselineUser?.totalResources || 0) * 0.95 &&
        (shockedUser?.competitiveStrength || 0) >= (baselineUser?.competitiveStrength || 0) * 0.9,
    };
  });
  let recoveryStreak = 0;
  let counterfactualRecoveredAtRound: number | null = null;
  losses.forEach((loss) => {
    if (loss.round <= input.manifest.shock.appliedRound) return;
    recoveryStreak = loss.isNearTwin ? recoveryStreak + 1 : 0;
    if (recoveryStreak >= 3 && counterfactualRecoveredAtRound == null)
      counterfactualRecoveredAtRound = loss.round;
  });
  const afterShock = losses.filter((loss) => loss.round >= input.manifest.shock.appliedRound);
  const closing = losses.at(-1) || {
    resource: 0,
    competitive: 0,
    points: 0,
  };

  return {
    pairId: input.manifest.pairId,
    config: input.config,
    manifest: input.manifest,
    targetUserId,
    baseline,
    shocked,
    impact: {
      peakResourceLoss: Math.max(0, ...afterShock.map((loss) => loss.resource)),
      resourceLossArea: afterShock.reduce((sum, loss) => sum + loss.resource, 0),
      peakCompetitiveLoss: Math.max(0, ...afterShock.map((loss) => loss.competitive)),
      competitiveLossArea: afterShock.reduce((sum, loss) => sum + loss.competitive, 0),
      finalResourceLoss: closing.resource,
      finalCompetitiveLoss: closing.competitive,
      finalPointsLoss: closing.points,
      counterfactualRecovered: counterfactualRecoveredAtRound != null,
      counterfactualRecoveredAtRound,
      absoluteRecovered: shocked.recovery.recoveredAtRound != null,
    },
  };
}

function quantile(sorted: number[], fraction: number) {
  if (!sorted.length) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * fraction))];
}

function summarize(values: number[], binCount = 12): SimulationDistribution {
  const safe = values.map((value) => (Number.isFinite(value) ? value : 0));
  const sorted = [...safe].sort((left, right) => left - right);
  const mean = safe.length ? safe.reduce((sum, value) => sum + value, 0) / safe.length : 0;
  const standardDeviation = safe.length
    ? Math.sqrt(safe.reduce((sum, value) => sum + (value - mean) ** 2, 0) / safe.length)
    : 0;
  const min = sorted[0] || 0;
  const max = sorted.at(-1) || 0;
  const width = max > min ? (max - min) / binCount : 0;
  const histogram = Array.from({ length: width ? binCount : 1 }, (_, index) => ({
    start: width ? min + width * index : min,
    end: width ? (index === binCount - 1 ? max : min + width * (index + 1)) : max,
    count: 0,
  }));
  safe.forEach((value) => {
    const index = width
      ? Math.min(binCount - 1, Math.max(0, Math.floor((value - min) / width)))
      : 0;
    histogram[index].count += 1;
  });
  return {
    mean,
    median: quantile(sorted, 0.5),
    standardDeviation,
    min,
    max,
    quantiles: {
      p05: quantile(sorted, 0.05),
      p10: quantile(sorted, 0.1),
      p25: quantile(sorted, 0.25),
      p50: quantile(sorted, 0.5),
      p75: quantile(sorted, 0.75),
      p90: quantile(sorted, 0.9),
      p95: quantile(sorted, 0.95),
    },
    histogram,
  };
}

function probability(values: boolean[]): SimulationProbabilityEstimate {
  const total = values.length;
  const successes = values.filter(Boolean).length;
  if (!total) return { value: 0, interval95: [0, 1], successes: 0, total: 0 };
  const value = successes / total;
  const z = 1.96;
  const denominator = 1 + (z * z) / total;
  const center = (value + (z * z) / (2 * total)) / denominator;
  const margin =
    (z / denominator) * Math.sqrt((value * (1 - value)) / total + (z * z) / (4 * total * total));
  return {
    value,
    interval95: [Math.max(0, center - margin), Math.min(1, center + margin)],
    successes,
    total,
  };
}

function finalUsers(run: PairedSeasonOutcome) {
  return run.shocked.timeline.at(-1)?.users || [];
}

function pointsRanking(run: PairedSeasonOutcome, timelineIndex: number) {
  return [...(run.shocked.timeline[timelineIndex]?.users || [])].sort(
    (left, right) => right.points - left.points || left.userId.localeCompare(right.userId)
  );
}

function leadChanges(run: PairedSeasonOutcome) {
  let previous = '';
  let changes = 0;
  run.shocked.timeline.slice(1).forEach((_point, index) => {
    const leader = pointsRanking(run, index + 1)[0]?.userId || '';
    if (previous && leader !== previous) changes += 1;
    previous = leader;
  });
  return changes;
}

function rankMobility(run: PairedSeasonOutcome) {
  const rankings = run.shocked.timeline
    .slice(1)
    .map((_point, index) => pointsRanking(run, index + 1).map((user) => user.userId));
  if (rankings.length < 2) return 0;
  let movement = 0;
  for (let index = 1; index < rankings.length; index += 1) {
    rankings[index].forEach((userId, rank) => {
      movement += Math.abs(rankings[index - 1].indexOf(userId) - rank);
    });
  }
  return movement / ((rankings.length - 1) * Math.max(1, rankings[0].length));
}

function correlation(left: number[], right: number[]) {
  if (!left.length || left.length !== right.length) return 0;
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
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

function resourceFuturePointsCorrelation(run: PairedSeasonOutcome) {
  const correlations: number[] = [];
  for (let index = 0; index < run.shocked.timeline.length - 1; index += 1) {
    const current = run.shocked.timeline[index];
    const future = run.shocked.timeline[Math.min(run.shocked.timeline.length - 1, index + 3)];
    const futureByUser = new Map(future.users.map((user) => [user.userId, user.points]));
    correlations.push(
      correlation(
        current.users.map((user) => user.totalResources),
        current.users.map((user) => (futureByUser.get(user.userId) ?? user.points) - user.points)
      )
    );
  }
  return correlations.length
    ? correlations.reduce((sum, value) => sum + value, 0) / correlations.length
    : 0;
}

function openingSquadFinalPointsCorrelation(run: PairedSeasonOutcome) {
  const opening = run.shocked.timeline[0]?.users || [];
  const closing = new Map(
    (run.shocked.timeline.at(-1)?.users || []).map((user) => [user.userId, user.points])
  );
  return correlation(
    opening.map((user) => user.squadValue),
    opening.map((user) => closing.get(user.userId) || 0)
  );
}

function recoveryRounds(run: PairedSeasonOutcome) {
  return run.impact.counterfactualRecoveredAtRound == null
    ? run.shocked.timeline.length
    : run.impact.counterfactualRecoveredAtRound - run.manifest.shock.appliedRound;
}

function recoveredWithin(run: PairedSeasonOutcome, rounds: number) {
  return (
    run.impact.counterfactualRecoveredAtRound != null &&
    run.impact.counterfactualRecoveredAtRound - run.manifest.shock.appliedRound <= rounds
  );
}

function finalRank(outcome: PairedSeasonOutcome['baseline'], userId: string) {
  return [...(outcome.timeline.at(-1)?.users || [])]
    .sort((left, right) => right.points - left.points || left.userId.localeCompare(right.userId))
    .findIndex((user) => user.userId === userId);
}

function resourceGapAt(point: PairedSeasonOutcome['shocked']['timeline'][number]) {
  const resources = point.users.map((user) => user.totalResources);
  return resources.length ? Math.max(...resources) - Math.min(...resources) : 0;
}

function roundToResourceGap(run: PairedSeasonOutcome, threshold: number) {
  return (
    run.shocked.timeline.find((point) => resourceGapAt(point) >= threshold)?.round ||
    run.shocked.timeline.length
  );
}

function scenarioAggregate(runs: PairedSeasonOutcome[]): SimulationScenarioAggregate {
  return {
    sampleSize: runs.length,
    counterfactualRecovery: probability(runs.map((run) => run.impact.counterfactualRecovered)),
    absoluteRecovery: probability(runs.map((run) => run.impact.absoluteRecovered)),
    peakResourceLoss: summarize(runs.map((run) => run.impact.peakResourceLoss)),
    recoveryRounds: summarize(runs.map(recoveryRounds)),
  };
}

function normalizedEntropy(values: string[]) {
  if (!values.length) return 0;
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  if (counts.size <= 1) return 0;
  const entropy = Array.from(counts.values()).reduce((sum, count) => {
    const share = count / values.length;
    return sum - share * Math.log(share);
  }, 0);
  return entropy / Math.log(counts.size);
}

export function summarizePairedSeason(run: PairedSeasonOutcome): SimulationRunSample {
  const closing = finalUsers(run);
  const resources = closing.map((user) => user.totalResources);
  const points = closing.map((user) => user.points);
  const transactions = run.shocked.transactions;
  const buys = transactions.filter((row) => row.type === 'buy' && row.marketValue > 0);
  const targetRank = finalRank(run.shocked, run.targetUserId);
  const baselineTargetRank = finalRank(run.baseline, run.targetUserId);
  const totalResources = closing.reduce((sum, user) => sum + user.totalResources, 0);
  const totalSquads = closing.reduce((sum, user) => sum + user.squadValue, 0);
  const listings = run.shocked.marketListings;
  return {
    shockKind: run.manifest.shock.kind,
    shockSeverity: run.manifest.shock.severity,
    phase: run.manifest.phase,
    metrics: {
      finalResourceGini: run.shocked.timeline.at(-1)?.resourceGini || 0,
      finalSquadGini: run.shocked.timeline.at(-1)?.squadGini || 0,
      finalResourceGap: resources.length ? Math.max(...resources) - Math.min(...resources) : 0,
      finalPointsGap: points.length ? Math.max(...points) - Math.min(...points) : 0,
      resourceInequalityArea: run.shocked.timeline.reduce(
        (sum, point) => sum + point.resourceGini,
        0
      ),
      resourceGapArea: run.shocked.timeline.reduce((sum, point) => sum + resourceGapAt(point), 0),
      roundToFiveMillionGap: roundToResourceGap(run, 5_000_000),
      roundToTenMillionGap: roundToResourceGap(run, 10_000_000),
      roundToTwentyMillionGap: roundToResourceGap(run, 20_000_000),
      productiveResourceShare: totalResources
        ? Math.max(0, Math.min(1, totalSquads / totalResources))
        : 0,
      resourceFuturePointsCorrelation: resourceFuturePointsCorrelation(run),
      openingSquadFinalPointsCorrelation: openingSquadFinalPointsCorrelation(run),
      squadInequalityArea: run.shocked.timeline.reduce((sum, point) => sum + point.squadGini, 0),
      midseasonContenders:
        run.shocked.timeline[Math.floor(run.shocked.timeline.length / 2)]?.titleContenders || 0,
      leadChanges: leadChanges(run),
      rankMobility: rankMobility(run),
      marketTransactions: transactions.length,
      uniquePlayersTraded: new Set(transactions.map((row) => row.playerId)).size,
      marketCoverage:
        new Set(listings.map((listing) => listing.playerId)).size /
        Math.max(1, run.shocked.catalogSize),
      averageBidders: listings.length
        ? listings.reduce((sum, listing) => sum + listing.bidCount, 0) / listings.length
        : 0,
      unsoldListingRate: listings.length
        ? listings.filter((listing) => !listing.sold).length / listings.length
        : 0,
      marketVolume: transactions.reduce((sum, row) => sum + row.amount, 0),
      averageOverpay: buys.length
        ? buys.reduce((sum, row) => sum + row.amount / row.marketValue - 1, 0) / buys.length
        : 0,
      totalBonuses: closing.reduce((sum, user) => sum + user.bonuses, 0),
      peakResourceLoss: run.impact.peakResourceLoss,
      resourceLossArea: run.impact.resourceLossArea,
      peakCompetitiveLoss: run.impact.peakCompetitiveLoss,
      competitiveLossArea: run.impact.competitiveLossArea,
      recoveryRounds: recoveryRounds(run),
      skillOutcomeCorrelation: correlation(
        closing.map((user) => user.decisionQuality),
        closing.map((user) => user.points)
      ),
      openingForcedReleases: run.shocked.openingForcedReleases,
    },
    counterfactualRecovered: run.impact.counterfactualRecovered,
    absoluteRecovered: run.impact.absoluteRecovered,
    recoveryWithinFiveRounds: recoveredWithin(run, 5),
    recoveryWithinTenRounds: recoveredWithin(run, 10),
    recoveryWithinTwentyRounds: recoveredWithin(run, 20),
    targetWinsTitle: targetRank === 0,
    targetFinishesPodium: targetRank >= 0 && targetRank <= 2,
    targetFinishesLast: targetRank === closing.length - 1,
    losesTitleOpportunity: baselineTargetRank === 0 && targetRank !== 0,
    losesPodiumOpportunity: baselineTargetRank >= 0 && baselineTargetRank <= 2 && targetRank > 2,
    championProfileId:
      [...closing].sort((left, right) => right.points - left.points)[0]?.profileId || '',
  };
}

function scenarioSampleAggregate(samples: SimulationRunSample[]): SimulationScenarioAggregate {
  return {
    sampleSize: samples.length,
    counterfactualRecovery: probability(samples.map((sample) => sample.counterfactualRecovered)),
    absoluteRecovery: probability(samples.map((sample) => sample.absoluteRecovered)),
    peakResourceLoss: summarize(samples.map((sample) => sample.metrics.peakResourceLoss)),
    recoveryRounds: summarize(samples.map((sample) => sample.metrics.recoveryRounds)),
  };
}

export function aggregateConfigurationSamples(
  config: SimulationGridConfig,
  samples: SimulationRunSample[]
): ConfigurationSimulationAggregate {
  if (!samples.length) throw new Error('At least one paired season sample is required');
  const metricKeys = Object.keys(samples[0].metrics) as Array<keyof SimulationRunSample['metrics']>;
  const metrics = Object.fromEntries(
    metricKeys.map((key) => [key, summarize(samples.map((sample) => sample.metrics[key]))])
  ) as ConfigurationSimulationAggregate['metrics'];
  const group = <Key extends string>(getter: (sample: SimulationRunSample) => Key) => {
    const groups = new Map<Key, SimulationRunSample[]>();
    samples.forEach((sample) => {
      const key = getter(sample);
      groups.set(key, [...(groups.get(key) || []), sample]);
    });
    return Object.fromEntries(
      Array.from(groups, ([key, rows]) => [key, scenarioSampleAggregate(rows)])
    );
  };
  return {
    config,
    sampleSize: samples.length,
    metrics,
    probabilities: {
      counterfactualRecovery: probability(samples.map((sample) => sample.counterfactualRecovered)),
      absoluteRecovery: probability(samples.map((sample) => sample.absoluteRecovered)),
      recoveryWithinFiveRounds: probability(
        samples.map((sample) => sample.recoveryWithinFiveRounds)
      ),
      recoveryWithinTenRounds: probability(samples.map((sample) => sample.recoveryWithinTenRounds)),
      recoveryWithinTwentyRounds: probability(
        samples.map((sample) => sample.recoveryWithinTwentyRounds)
      ),
      lockIn: probability(samples.map((sample) => !sample.counterfactualRecovered)),
      targetWinsTitle: probability(samples.map((sample) => sample.targetWinsTitle)),
      targetFinishesPodium: probability(samples.map((sample) => sample.targetFinishesPodium)),
      targetFinishesLast: probability(samples.map((sample) => sample.targetFinishesLast)),
      losesTitleOpportunity: probability(samples.map((sample) => sample.losesTitleOpportunity)),
      losesPodiumOpportunity: probability(samples.map((sample) => sample.losesPodiumOpportunity)),
    },
    scenarios: group((sample) => sample.shockKind),
    severities: group((sample) => sample.shockSeverity),
    phases: group((sample) => sample.phase),
    championProfileEntropy: normalizedEntropy(samples.map((sample) => sample.championProfileId)),
  };
}

export function aggregateConfigurationRuns(
  config: SimulationGridConfig,
  runs: PairedSeasonOutcome[]
): ConfigurationSimulationAggregate {
  if (!runs.length) throw new Error('At least one paired season is required');
  const scenarioGroups = new Map<ShockConfig['kind'], PairedSeasonOutcome[]>();
  const severityGroups = new Map<ShockConfig['severity'], PairedSeasonOutcome[]>();
  const phaseGroups = new Map<SimulationSeasonPhase, PairedSeasonOutcome[]>();
  runs.forEach((run) => {
    const kind = run.manifest.shock.kind;
    scenarioGroups.set(kind, [...(scenarioGroups.get(kind) || []), run]);
    const severity = run.manifest.shock.severity;
    severityGroups.set(severity, [...(severityGroups.get(severity) || []), run]);
    const phase = run.manifest.phase;
    phaseGroups.set(phase, [...(phaseGroups.get(phase) || []), run]);
  });
  const closingRows = runs.map(finalUsers);
  const resourceGaps = closingRows.map((users) => {
    const values = users.map((user) => user.totalResources);
    return values.length ? Math.max(...values) - Math.min(...values) : 0;
  });
  const pointGaps = closingRows.map((users) => {
    const values = users.map((user) => user.points);
    return values.length ? Math.max(...values) - Math.min(...values) : 0;
  });
  const targetRanks = runs.map((run) =>
    pointsRanking(run, run.shocked.timeline.length - 1).findIndex(
      (user) => user.userId === run.targetUserId
    )
  );
  const baselineTargetRanks = runs.map((run) => finalRank(run.baseline, run.targetUserId));
  const champions = closingRows.map(
    (users) => [...users].sort((left, right) => right.points - left.points)[0]?.profileId || ''
  );
  const transactions = runs.map((run) => run.shocked.transactions);

  return {
    config,
    sampleSize: runs.length,
    metrics: {
      finalResourceGini: summarize(
        runs.map((run) => run.shocked.timeline.at(-1)?.resourceGini || 0)
      ),
      finalSquadGini: summarize(runs.map((run) => run.shocked.timeline.at(-1)?.squadGini || 0)),
      finalResourceGap: summarize(resourceGaps),
      finalPointsGap: summarize(pointGaps),
      resourceInequalityArea: summarize(
        runs.map((run) => run.shocked.timeline.reduce((sum, point) => sum + point.resourceGini, 0))
      ),
      squadInequalityArea: summarize(
        runs.map((run) => run.shocked.timeline.reduce((sum, point) => sum + point.squadGini, 0))
      ),
      midseasonContenders: summarize(
        runs.map(
          (run) =>
            run.shocked.timeline[Math.floor(run.shocked.timeline.length / 2)]?.titleContenders || 0
        )
      ),
      resourceGapArea: summarize(
        runs.map((run) =>
          run.shocked.timeline.reduce((sum, point) => sum + resourceGapAt(point), 0)
        )
      ),
      roundToFiveMillionGap: summarize(runs.map((run) => roundToResourceGap(run, 5_000_000))),
      roundToTenMillionGap: summarize(runs.map((run) => roundToResourceGap(run, 10_000_000))),
      roundToTwentyMillionGap: summarize(runs.map((run) => roundToResourceGap(run, 20_000_000))),
      productiveResourceShare: summarize(
        closingRows.map((users) => {
          const resources = users.reduce((sum, user) => sum + user.totalResources, 0);
          const squads = users.reduce((sum, user) => sum + user.squadValue, 0);
          return resources ? Math.max(0, Math.min(1, squads / resources)) : 0;
        })
      ),
      resourceFuturePointsCorrelation: summarize(runs.map(resourceFuturePointsCorrelation)),
      openingSquadFinalPointsCorrelation: summarize(runs.map(openingSquadFinalPointsCorrelation)),
      leadChanges: summarize(runs.map(leadChanges)),
      rankMobility: summarize(runs.map(rankMobility)),
      marketTransactions: summarize(transactions.map((rows) => rows.length)),
      uniquePlayersTraded: summarize(
        transactions.map((rows) => new Set(rows.map((row) => row.playerId)).size)
      ),
      marketCoverage: summarize(
        runs.map(
          (run) =>
            new Set(run.shocked.marketListings.map((listing) => listing.playerId)).size /
            Math.max(1, run.shocked.catalogSize)
        )
      ),
      averageBidders: summarize(
        runs.map((run) =>
          run.shocked.marketListings.length
            ? run.shocked.marketListings.reduce((sum, listing) => sum + listing.bidCount, 0) /
              run.shocked.marketListings.length
            : 0
        )
      ),
      unsoldListingRate: summarize(
        runs.map((run) =>
          run.shocked.marketListings.length
            ? run.shocked.marketListings.filter((listing) => !listing.sold).length /
              run.shocked.marketListings.length
            : 0
        )
      ),
      marketVolume: summarize(
        transactions.map((rows) => rows.reduce((sum, row) => sum + row.amount, 0))
      ),
      averageOverpay: summarize(
        transactions.map((rows) => {
          const buys = rows.filter((row) => row.type === 'buy' && row.marketValue > 0);
          return buys.length
            ? buys.reduce((sum, row) => sum + row.amount / row.marketValue - 1, 0) / buys.length
            : 0;
        })
      ),
      totalBonuses: summarize(
        closingRows.map((users) => users.reduce((sum, user) => sum + user.bonuses, 0))
      ),
      peakResourceLoss: summarize(runs.map((run) => run.impact.peakResourceLoss)),
      resourceLossArea: summarize(runs.map((run) => run.impact.resourceLossArea)),
      peakCompetitiveLoss: summarize(runs.map((run) => run.impact.peakCompetitiveLoss)),
      competitiveLossArea: summarize(runs.map((run) => run.impact.competitiveLossArea)),
      recoveryRounds: summarize(runs.map(recoveryRounds)),
      skillOutcomeCorrelation: summarize(
        closingRows.map((users) =>
          correlation(
            users.map((user) => user.decisionQuality),
            users.map((user) => user.points)
          )
        )
      ),
      openingForcedReleases: summarize(runs.map((run) => run.shocked.openingForcedReleases)),
    },
    probabilities: {
      counterfactualRecovery: probability(runs.map((run) => run.impact.counterfactualRecovered)),
      absoluteRecovery: probability(runs.map((run) => run.impact.absoluteRecovered)),
      recoveryWithinFiveRounds: probability(runs.map((run) => recoveredWithin(run, 5))),
      recoveryWithinTenRounds: probability(runs.map((run) => recoveredWithin(run, 10))),
      recoveryWithinTwentyRounds: probability(runs.map((run) => recoveredWithin(run, 20))),
      lockIn: probability(runs.map((run) => !run.impact.counterfactualRecovered)),
      targetWinsTitle: probability(targetRanks.map((rank) => rank === 0)),
      targetFinishesPodium: probability(targetRanks.map((rank) => rank >= 0 && rank <= 2)),
      targetFinishesLast: probability(
        targetRanks.map((rank, index) => rank === closingRows[index].length - 1)
      ),
      losesTitleOpportunity: probability(
        targetRanks.map((rank, index) => baselineTargetRanks[index] === 0 && rank !== 0)
      ),
      losesPodiumOpportunity: probability(
        targetRanks.map(
          (rank, index) =>
            baselineTargetRanks[index] >= 0 && baselineTargetRanks[index] <= 2 && rank > 2
        )
      ),
    },
    scenarios: Object.fromEntries(
      Array.from(scenarioGroups.entries()).map(([kind, scenarioRuns]) => [
        kind,
        scenarioAggregate(scenarioRuns),
      ])
    ),
    severities: Object.fromEntries(
      Array.from(severityGroups.entries()).map(([severity, severityRuns]) => [
        severity,
        scenarioAggregate(severityRuns),
      ])
    ),
    phases: Object.fromEntries(
      Array.from(phaseGroups.entries()).map(([phase, phaseRuns]) => [
        phase,
        scenarioAggregate(phaseRuns),
      ])
    ),
    championProfileEntropy: normalizedEntropy(champions),
  };
}

type ScoreGetter = (aggregate: ConfigurationSimulationAggregate) => number;

function percentileScores(
  aggregates: ConfigurationSimulationAggregate[],
  getter: ScoreGetter,
  higherIsBetter: boolean
) {
  const values = aggregates.map((aggregate) => getter(aggregate));
  const sorted = [...values].sort((left, right) => left - right);
  const scores = new Map<string, number>();
  aggregates.forEach((aggregate, index) => {
    const value = values[index];
    const first = sorted.indexOf(value);
    const last = sorted.lastIndexOf(value);
    const rank = (first + last) / 2;
    const ascending = sorted.length <= 1 ? 50 : (rank / (sorted.length - 1)) * 100;
    scores.set(aggregate.config.configId, higherIsBetter ? ascending : 100 - ascending);
  });
  return scores;
}

function meanScores(configId: string, maps: Array<Map<string, number>>) {
  return maps.reduce((sum, scores) => sum + (scores.get(configId) || 0), 0) / maps.length;
}

function calculateDimensions(aggregates: ConfigurationSimulationAggregate[]) {
  const score = (getter: ScoreGetter, higherIsBetter: boolean) =>
    percentileScores(aggregates, getter, higherIsBetter);
  const equality = [
    score((item) => item.metrics.finalResourceGini.median, false),
    score((item) => item.metrics.finalSquadGini.median, false),
    score((item) => item.metrics.resourceInequalityArea.mean, false),
    score((item) => item.metrics.resourceGapArea.mean, false),
    score((item) => Math.abs(item.metrics.resourceFuturePointsCorrelation.mean), false),
    score((item) => Math.abs(item.metrics.openingSquadFinalPointsCorrelation.mean), false),
    score((item) => item.metrics.finalResourceGap.median, false),
  ];
  const competitiveness = [
    score((item) => item.metrics.finalPointsGap.median, false),
    score((item) => item.metrics.midseasonContenders.mean, true),
    score((item) => item.metrics.leadChanges.mean, true),
    score((item) => item.metrics.rankMobility.mean, true),
    score((item) => item.championProfileEntropy, true),
  ];
  const resilience = [
    score((item) => item.probabilities.counterfactualRecovery.value, true),
    score((item) => item.probabilities.recoveryWithinTenRounds.value, true),
    score((item) => item.probabilities.lockIn.value, false),
    score((item) => item.metrics.recoveryRounds.median, false),
    score((item) => item.metrics.resourceLossArea.mean, false),
    score((item) => item.metrics.competitiveLossArea.mean, false),
  ];
  const merit = [
    score((item) => item.metrics.skillOutcomeCorrelation.mean, true),
    score((item) => item.metrics.finalPointsGap.median, true),
  ];
  const liquidity = [
    score((item) => item.metrics.marketTransactions.median, true),
    score((item) => item.metrics.uniquePlayersTraded.median, true),
    score((item) => item.metrics.marketVolume.median, true),
    score((item) => item.metrics.marketCoverage.mean, true),
    score((item) => item.metrics.averageBidders.mean, true),
    score((item) => item.metrics.unsoldListingRate.mean, false),
    score((item) => item.metrics.averageOverpay.mean, false),
  ];
  const inflationControl = [
    score((item) => item.metrics.totalBonuses.mean, false),
    score((item) => item.metrics.averageOverpay.mean, false),
  ];
  const practicality = [score((item) => item.metrics.openingForcedReleases.mean, false)];

  return new Map<string, SimulationDimensionScores>(
    aggregates.map((aggregate) => [
      aggregate.config.configId,
      {
        equality: meanScores(aggregate.config.configId, equality),
        competitiveness: meanScores(aggregate.config.configId, competitiveness),
        resilience: meanScores(aggregate.config.configId, resilience),
        merit: meanScores(aggregate.config.configId, merit),
        liquidity: meanScores(aggregate.config.configId, liquidity),
        inflationControl: meanScores(aggregate.config.configId, inflationControl),
        practicality: meanScores(aggregate.config.configId, practicality),
      },
    ])
  );
}

function dominates(left: SimulationDimensionScores, right: SimulationDimensionScores) {
  const keys = Object.keys(left) as Array<keyof SimulationDimensionScores>;
  return keys.every((key) => left[key] >= right[key]) && keys.some((key) => left[key] > right[key]);
}

const RANKING_PROFILES: Array<{
  profileId: SimulationRankingProfileId;
  label: string;
  weights: SimulationDimensionScores;
}> = [
  {
    profileId: 'equality',
    label: 'Máxima igualdad',
    weights: {
      equality: 0.45,
      competitiveness: 0.2,
      resilience: 0.15,
      merit: 0.03,
      liquidity: 0.1,
      inflationControl: 0.04,
      practicality: 0.03,
    },
  },
  {
    profileId: 'competitive-balance',
    label: 'Equilibrio competitivo',
    weights: {
      equality: 0.25,
      competitiveness: 0.35,
      resilience: 0.15,
      merit: 0.1,
      liquidity: 0.1,
      inflationControl: 0.03,
      practicality: 0.02,
    },
  },
  {
    profileId: 'resilience',
    label: 'Máxima resiliencia',
    weights: {
      equality: 0.2,
      competitiveness: 0.2,
      resilience: 0.4,
      merit: 0.05,
      liquidity: 0.1,
      inflationControl: 0.03,
      practicality: 0.02,
    },
  },
  {
    profileId: 'merit',
    label: 'Premiar el mérito',
    weights: {
      equality: 0.1,
      competitiveness: 0.2,
      resilience: 0.1,
      merit: 0.45,
      liquidity: 0.05,
      inflationControl: 0.05,
      practicality: 0.05,
    },
  },
  {
    profileId: 'balanced',
    label: 'Balance general',
    weights: {
      equality: 0.2,
      competitiveness: 0.2,
      resilience: 0.2,
      merit: 0.15,
      liquidity: 0.1,
      inflationControl: 0.08,
      practicality: 0.07,
    },
  },
];

function weightedScore(dimensions: SimulationDimensionScores, weights: SimulationDimensionScores) {
  return (Object.keys(dimensions) as Array<keyof SimulationDimensionScores>).reduce(
    (sum, key) => sum + dimensions[key] * weights[key],
    0
  );
}

function deterministicRankingNoise(draw: number, configIndex: number) {
  const raw = Math.sin((draw + 1) * 12.9898 + (configIndex + 1) * 78.233) * 43_758.5453;
  return (raw - Math.floor(raw) - 0.5) * 2;
}

function topTenProbabilities(
  rows: Array<{ configId: string; score: number; sampleSize: number }>,
  draws = 200
) {
  if (rows.length <= 10) return new Map(rows.map((row) => [row.configId, 1]));
  const appearances = new Map(rows.map((row) => [row.configId, 0]));
  for (let draw = 0; draw < draws; draw += 1) {
    const selected = rows
      .map((row, index) => ({
        configId: row.configId,
        score:
          row.score +
          deterministicRankingNoise(draw, index) * (50 / Math.sqrt(Math.max(1, row.sampleSize))),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 10);
    selected.forEach((row) =>
      appearances.set(row.configId, (appearances.get(row.configId) || 0) + 1)
    );
  }
  return new Map(Array.from(appearances, ([configId, count]) => [configId, count / draws]));
}

export function buildSimulationRanking(
  aggregates: ConfigurationSimulationAggregate[]
): SimulationRankingResult {
  if (!aggregates.length) return { paretoConfigIds: [], profiles: [] };
  const dimensions = calculateDimensions(aggregates);
  const paretoConfigIds = aggregates
    .filter((candidate) => {
      const candidateDimensions = dimensions.get(candidate.config.configId)!;
      return !aggregates.some((other) => {
        if (other.config.configId === candidate.config.configId) return false;
        return dominates(dimensions.get(other.config.configId)!, candidateDimensions);
      });
    })
    .map((aggregate) => aggregate.config.configId);
  const pareto = new Set(paretoConfigIds);
  const profiles: SimulationProfileRanking[] = RANKING_PROFILES.map((profile) => {
    const scored = aggregates.map((aggregate) => ({
      aggregate,
      dimensions: dimensions.get(aggregate.config.configId)!,
      score: weightedScore(dimensions.get(aggregate.config.configId)!, profile.weights),
    }));
    const topTen = topTenProbabilities(
      scored.map((row) => ({
        configId: row.aggregate.config.configId,
        score: row.score,
        sampleSize: row.aggregate.sampleSize,
      }))
    );
    const entries = scored
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.dimensions.practicality - left.dimensions.practicality ||
          left.aggregate.config.configId.localeCompare(right.aggregate.config.configId)
      )
      .map((row, index) => ({
        rank: index + 1,
        configId: row.aggregate.config.configId,
        config: row.aggregate.config,
        score: row.score,
        dimensions: row.dimensions,
        isParetoOptimal: pareto.has(row.aggregate.config.configId),
        topTenProbability: topTen.get(row.aggregate.config.configId) || 0,
      }));
    return { ...profile, entries };
  });
  return { paretoConfigIds, profiles };
}

export function selectSimulationShortlist(ranking: SimulationRankingResult, limit: number) {
  const maximum = Math.max(1, Math.floor(limit));
  const candidates = new Map<
    string,
    { configId: string; bestRank: number; profileAppearances: number; isPareto: boolean }
  >();
  ranking.profiles.forEach((profile) => {
    profile.entries.slice(0, Math.max(10, Math.ceil(maximum / 2))).forEach((entry) => {
      const current = candidates.get(entry.configId) || {
        configId: entry.configId,
        bestRank: Infinity,
        profileAppearances: 0,
        isPareto: entry.isParetoOptimal,
      };
      current.bestRank = Math.min(current.bestRank, entry.rank);
      current.profileAppearances += 1;
      current.isPareto ||= entry.isParetoOptimal;
      candidates.set(entry.configId, current);
    });
  });
  ranking.paretoConfigIds.forEach((configId) => {
    if (candidates.has(configId)) return;
    const bestRank = Math.min(
      ...ranking.profiles.map(
        (profile) => profile.entries.find((entry) => entry.configId === configId)?.rank || Infinity
      )
    );
    candidates.set(configId, {
      configId,
      bestRank,
      profileAppearances: 0,
      isPareto: true,
    });
  });
  const selected = Array.from(candidates.values())
    .sort(
      (left, right) =>
        left.bestRank - right.bestRank ||
        right.profileAppearances - left.profileAppearances ||
        Number(right.isPareto) - Number(left.isPareto) ||
        left.configId.localeCompare(right.configId)
    )
    .slice(0, maximum)
    .map((candidate) => candidate.configId);
  const historicalId = 's25-m20-inverse-10000';
  const historicalExists = ranking.profiles[0]?.entries.some(
    (entry) => entry.configId === historicalId
  );
  if (historicalExists && !selected.includes(historicalId)) {
    if (selected.length >= maximum) selected[selected.length - 1] = historicalId;
    else selected.push(historicalId);
  }
  return selected;
}
