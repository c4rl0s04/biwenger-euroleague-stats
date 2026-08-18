import { describe, expect, it } from 'vitest';
import {
  aggregateConfigurationRuns,
  aggregateConfigurationSamples,
  buildSimulationRanking,
  generateConfigurationGrid,
  generateSeedManifest,
  selectSimulationShortlist,
  simulatePairedSeason,
  summarizePairedSeason,
} from './simulation-analysis';
import type { SeasonSimulationDataset } from './simulation-types';

const pairedDataset: SeasonSimulationDataset = {
  startingBudget: 40_000_000,
  userCount: 3,
  initialRosterSize: 2,
  lineupSize: 2,
  lineupPositionTargets: { base: 1, pivot: 1 },
  marketDaysPerRound: 2,
  rounds: [1, 2, 3, 4, 5, 6],
  players: Array.from({ length: 15 }, (_, index) => ({
    id: String(index + 1),
    position: ['base', 'alero', 'pivot'][index % 3],
    initialPrice: 900_000 + index * 120_000,
    roundPoints: [8, 14, 10, 17, 11, 15].map((points) => points + index),
    priceChanges: [0.02, 0.01, -0.02, 0.03, -0.01, 0.02],
  })),
};

describe('season simulation analysis', () => {
  it('generates every supported configuration exactly once', () => {
    const configurations = generateConfigurationGrid();

    expect(configurations).toHaveLength(1_920);
    expect(new Set(configurations.map((item) => item.configId)).size).toBe(1_920);
    expect(configurations[0]).toEqual({
      configId: 's10-m01-direct-5000',
      rosterCap: 10,
      marketSlots: 1,
      payoutDirection: 'direct',
      eurosPerPoint: 5_000,
    });
    expect(configurations.at(-1)).toEqual({
      configId: 's25-m20-inverse-10000',
      rosterCap: 25,
      marketSlots: 20,
      payoutDirection: 'inverse',
      eurosPerPoint: 10_000,
    });
  });

  it('builds a deterministic and stratified scenario manifest', () => {
    const manifest = generateSeedManifest({ pairs: 36, baseSeed: 202_526, rounds: 45 });

    expect(manifest).toHaveLength(36);
    expect(new Set(manifest.map((item) => item.seed)).size).toBe(36);
    expect(manifest[0]).toEqual({
      pairId: 'pair-0001',
      seed: 202_526,
      shock: { kind: 'bad-transfer', severity: 'low', appliedRound: 5 },
      phase: 'early',
    });
    expect(new Set(manifest.map((item) => item.shock.kind))).toEqual(
      new Set(['bad-transfer', 'bad-streak', 'star-injury', 'inactivity'])
    );
    expect(new Set(manifest.map((item) => item.shock.severity))).toEqual(
      new Set(['low', 'medium', 'high'])
    );
    expect(new Set(manifest.map((item) => item.phase))).toEqual(
      new Set(['early', 'first-third', 'midseason'])
    );
    expect(generateSeedManifest({ pairs: 36, baseSeed: 202_526, rounds: 45 })).toEqual(manifest);
  });

  it('simulates a shock and its no-shock twin with the same exogenous season', () => {
    const config = generateConfigurationGrid().find(
      (item) => item.rosterCap === 3 && item.marketSlots === 4
    ) || {
      configId: 'fixture',
      rosterCap: 3,
      marketSlots: 4,
      payoutDirection: 'inverse' as const,
      eurosPerPoint: 10_000,
    };
    const manifest = {
      pairId: 'pair-0001',
      seed: 42,
      phase: 'early' as const,
      shock: { kind: 'bad-transfer' as const, severity: 'medium' as const, appliedRound: 2 },
    };

    const paired = simulatePairedSeason({ dataset: pairedDataset, config, manifest });

    expect(simulatePairedSeason({ dataset: pairedDataset, config, manifest })).toEqual(paired);
    expect(paired.baseline.timeline[0].users.map((user) => user.totalResources)).toEqual([
      40_000_000, 40_000_000, 40_000_000,
    ]);
    expect(paired.targetUserId).toBe(paired.shocked.recovery.targetUserId);
    expect(paired.impact.peakResourceLoss).toBeGreaterThan(0);
    expect(paired.impact.resourceLossArea).toBeGreaterThan(0);
  });

  it('aggregates paired seasons into distributions, intervals and scenario breakdowns', () => {
    const config = {
      configId: 'fixture',
      rosterCap: 3,
      marketSlots: 4,
      payoutDirection: 'inverse' as const,
      eurosPerPoint: 10_000,
    };
    const runs = generateSeedManifest({ pairs: 36, baseSeed: 7_000, rounds: 6 }).map((manifest) =>
      simulatePairedSeason({ dataset: pairedDataset, config, manifest })
    );

    const aggregate = aggregateConfigurationRuns(config, runs);
    expect(aggregateConfigurationSamples(config, runs.map(summarizePairedSeason))).toEqual(
      aggregate
    );

    expect(aggregate.sampleSize).toBe(36);
    expect(aggregate.probabilities.counterfactualRecovery.interval95[0]).toBeLessThanOrEqual(
      aggregate.probabilities.counterfactualRecovery.value
    );
    expect(aggregate.probabilities.counterfactualRecovery.interval95[1]).toBeGreaterThanOrEqual(
      aggregate.probabilities.counterfactualRecovery.value
    );
    expect(aggregate.probabilities.recoveryWithinTenRounds.value).toBeGreaterThanOrEqual(0);
    expect(aggregate.probabilities.recoveryWithinTenRounds.value).toBeLessThanOrEqual(1);
    expect(aggregate.metrics.finalResourceGini.quantiles.p05).toBeLessThanOrEqual(
      aggregate.metrics.finalResourceGini.quantiles.p95
    );
    expect(
      aggregate.metrics.finalResourceGap.histogram.reduce((sum, bin) => sum + bin.count, 0)
    ).toBe(36);
    expect(Object.values(aggregate.scenarios).reduce((sum, item) => sum + item.sampleSize, 0)).toBe(
      36
    );
    expect(
      Object.values(aggregate.severities).reduce((sum, item) => sum + item.sampleSize, 0)
    ).toBe(36);
    expect(Object.values(aggregate.phases).reduce((sum, item) => sum + item.sampleSize, 0)).toBe(
      36
    );
    expect(aggregate.metrics.marketTransactions.median).toBeGreaterThan(0);
    expect(aggregate.metrics.marketCoverage.mean).toBeGreaterThan(0);
    expect(aggregate.metrics.marketCoverage.mean).toBeLessThanOrEqual(1);
    expect(aggregate.metrics.averageBidders.mean).toBeGreaterThanOrEqual(0);
    expect(aggregate.metrics.unsoldListingRate.mean).toBeGreaterThanOrEqual(0);
    expect(aggregate.metrics.unsoldListingRate.mean).toBeLessThanOrEqual(1);
    expect(aggregate.metrics.resourceInequalityArea.mean).toBeGreaterThanOrEqual(0);
    expect(aggregate.metrics.resourceGapArea.mean).toBeGreaterThanOrEqual(0);
    expect(aggregate.metrics.roundToFiveMillionGap.median).toBeGreaterThanOrEqual(0);
    expect(aggregate.metrics.productiveResourceShare.mean).toBeGreaterThanOrEqual(0);
    expect(aggregate.metrics.productiveResourceShare.mean).toBeLessThanOrEqual(1);
    expect(aggregate.metrics.resourceFuturePointsCorrelation.mean).toBeGreaterThanOrEqual(-1);
    expect(aggregate.metrics.resourceFuturePointsCorrelation.mean).toBeLessThanOrEqual(1);
    expect(aggregate.metrics.openingSquadFinalPointsCorrelation.mean).toBeGreaterThanOrEqual(-1);
    expect(aggregate.metrics.openingSquadFinalPointsCorrelation.mean).toBeLessThanOrEqual(1);
  });

  it('builds transparent profile rankings and a Pareto frontier', () => {
    const manifest = generateSeedManifest({ pairs: 24, baseSeed: 12_000, rounds: 6 });
    const configs = [
      {
        configId: 'compact-inverse',
        rosterCap: 2,
        marketSlots: 2,
        payoutDirection: 'inverse' as const,
        eurosPerPoint: 7_500,
      },
      {
        configId: 'liquid-direct',
        rosterCap: 4,
        marketSlots: 6,
        payoutDirection: 'direct' as const,
        eurosPerPoint: 10_000,
      },
    ];
    const aggregates = configs.map((config) =>
      aggregateConfigurationRuns(
        config,
        manifest.map((entry) =>
          simulatePairedSeason({ dataset: pairedDataset, config, manifest: entry })
        )
      )
    );

    const ranking = buildSimulationRanking(aggregates);

    expect(ranking.profiles).toHaveLength(5);
    expect(ranking.paretoConfigIds.length).toBeGreaterThan(0);
    ranking.profiles.forEach((profile) => {
      expect(profile.entries.map((entry) => entry.rank)).toEqual([1, 2]);
      expect(profile.entries.every((entry) => entry.score >= 0 && entry.score <= 100)).toBe(true);
      expect(profile.entries.every((entry) => entry.topTenProbability === 1)).toBe(true);
    });
    expect(selectSimulationShortlist(ranking, 1)).toHaveLength(1);
    expect(configs.map((config) => config.configId)).toContain(
      selectSimulationShortlist(ranking, 1)[0]
    );
  });
});
