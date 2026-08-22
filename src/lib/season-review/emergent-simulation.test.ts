import { describe, expect, it } from 'vitest';
import {
  aggregateEmergentRuns,
  buildCap15Analysis,
  buildEmergentRanking,
  emergentSeedForRun,
  generateEmergentConfigurationGrid,
  selectEmergentFinalists,
  simulateEmergentSeason,
  summarizeEmergentRun,
} from './emergent-simulation';
import type { SeasonSimulationDataset } from './simulation-types';

const dataset: SeasonSimulationDataset = {
  startingBudget: 40_000_000,
  userCount: 3,
  initialRosterSize: 10,
  lineupSize: 5,
  lineupPositionTargets: { base: 1, alero: 2, pivot: 2 },
  marketDaysPerRound: 2,
  rounds: [1, 2, 3, 4, 5, 6],
  players: Array.from({ length: 54 }, (_, index) => ({
    id: String(index + 1),
    position: ['base', 'alero', 'pivot'][index % 3],
    initialPrice: 500_000 + index * 20_000,
    roundPoints: [8, 14, 10, 17, 11, 15].map((points) => points + (index % 9)),
    priceChanges: [0.02, 0.01, -0.02, 0.03, -0.01, 0.02],
  })),
};

describe('emergent season V5', () => {
  it('generates the 96 supported configurations with fixed inverse payout and market size', () => {
    const configurations = generateEmergentConfigurationGrid();

    expect(configurations).toHaveLength(96);
    expect(new Set(configurations.map((config) => config.configId)).size).toBe(96);
    expect(configurations[0]).toEqual({
      configId: 's10-m20-inverse-5000',
      rosterCap: 10,
      marketSlots: 20,
      payoutDirection: 'inverse',
      eurosPerPoint: 5_000,
    });
    expect(configurations.at(-1)).toEqual({
      configId: 's25-m20-inverse-17500',
      rosterCap: 25,
      marketSlots: 20,
      payoutDirection: 'inverse',
      eurosPerPoint: 17_500,
    });
    expect(
      configurations.every(
        (config) => config.marketSlots === 20 && config.payoutDirection === 'inverse'
      )
    ).toBe(true);
  });

  it('assigns disjoint deterministic seeds to the base and finalist phases', () => {
    const base = Array.from({ length: 2_048 }, (_, index) => emergentSeedForRun(index));
    const extension = Array.from({ length: 8_192 - 2_048 }, (_, index) =>
      emergentSeedForRun(index + 2_048)
    );

    expect(new Set([...base, ...extension]).size).toBe(8_192);
    expect(extension[0]).toBe(emergentSeedForRun(2_048));
    expect(extension).not.toContain(base.at(-1));
  });

  it('runs a deterministic no-shock season with complete auditable detail', () => {
    const config = generateEmergentConfigurationGrid().find(
      (candidate) => candidate.configId === 's10-m20-inverse-10000'
    )!;
    const first = simulateEmergentSeason({ dataset, config, seed: 202_526 });
    const repeated = simulateEmergentSeason({ dataset, config, seed: 202_526 });

    expect(repeated).toEqual(first);
    expect(first.modelVersion).toBe('agent-season-v5');
    expect(first.runId).toBe('run-202526');
    expect(first.profiles).toHaveLength(3);
    expect(first.timeline[0].users.map((user) => user.totalResources)).toEqual([
      40_000_000, 40_000_000, 40_000_000,
    ]);
    expect(
      first.timeline.every((point) => point.users.every((user) => user.rosterSize <= 10))
    ).toBe(true);
    expect(
      first.timeline
        .slice(1)
        .every((point) =>
          point.users.every(
            (user) =>
              user.lineupPlayerIds.length <= dataset.lineupSize &&
              user.rosterPlayers.length === user.rosterSize
          )
        )
    ).toBe(true);
    expect(first.marketListings.length).toBeGreaterThan(0);
    expect(first.marketListings.every((listing) => Array.isArray(listing.bids))).toBe(true);

    const listingsByDay = new Map<string, number>();
    first.marketListings.forEach((listing) => {
      const key = `${listing.round}-${listing.marketDay}`;
      listingsByDay.set(key, (listingsByDay.get(key) || 0) + 1);
    });
    expect(Math.max(...Array.from(listingsByDay.values()))).toBeLessThanOrEqual(20);
  });

  it('measures league-wide inequality, natural recovery, hoarding and liquidity', () => {
    const config = generateEmergentConfigurationGrid()[2];
    const runs = [101, 202, 303, 404].map((seed) =>
      simulateEmergentSeason({ dataset, config, seed })
    );
    const summaries = runs.map((run) => summarizeEmergentRun(run));
    const report = aggregateEmergentRuns(config, runs);

    expect(report.sampleSize).toBe(4);
    expect(report.runSummaries).toEqual(summaries);
    expect(report.timeline).toHaveLength(dataset.rounds.length + 1);
    expect(report.metrics.finalResourceGini.quantiles.p05).toBeLessThanOrEqual(
      report.metrics.finalResourceGini.quantiles.p95
    );
    expect(report.metrics.finalResourceGini.interval95[0]).toBeLessThanOrEqual(
      report.metrics.finalResourceGini.mean
    );
    expect(report.metrics.finalResourceGini.interval95[1]).toBeGreaterThanOrEqual(
      report.metrics.finalResourceGini.mean
    );
    for (const summary of summaries) {
      expect(summary.naturalRecovery.withinTenRounds).toBeGreaterThanOrEqual(0);
      expect(summary.naturalRecovery.withinTenRounds).toBeLessThanOrEqual(1);
      expect(summary.antiHoarding.topTalentConcentration).toBeGreaterThanOrEqual(0);
      expect(summary.antiHoarding.topTalentConcentration).toBeLessThanOrEqual(1);
      expect(summary.liquidity.marketCoverage).toBeGreaterThanOrEqual(0);
      expect(summary.liquidity.marketCoverage).toBeLessThanOrEqual(1);
    }
  });

  it('ranks configurations without mixing merit or practicality into global balance', () => {
    const configs = [
      generateEmergentConfigurationGrid().find(
        (config) => config.configId === 's15-m20-inverse-10000'
      )!,
      generateEmergentConfigurationGrid().find(
        (config) => config.configId === 's20-m20-inverse-10000'
      )!,
      generateEmergentConfigurationGrid().find(
        (config) => config.configId === 's25-m20-inverse-10000'
      )!,
    ];
    const reports = configs.map((config, configIndex) =>
      aggregateEmergentRuns(
        config,
        [1, 2, 3, 4].map((seed) =>
          simulateEmergentSeason({ dataset, config, seed: seed + configIndex * 100 })
        )
      )
    );
    const ranking = buildEmergentRanking(reports);

    expect(ranking).toHaveLength(3);
    expect(ranking.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(ranking.every((entry) => entry.balanceScore >= 0 && entry.balanceScore <= 100)).toBe(
      true
    );
    expect(
      ranking.every(
        (entry) =>
          entry.balanceScore ===
          entry.dimensions.economicEquality * 0.25 +
            entry.dimensions.competitiveBalance * 0.25 +
            entry.dimensions.naturalRecovery * 0.25 +
            entry.dimensions.antiHoarding * 0.15 +
            entry.dimensions.liquidity * 0.1
      )
    ).toBe(true);
  });

  it('selects 24 finalists while preserving all caps for the best payout family', () => {
    const grid = generateEmergentConfigurationGrid();
    const ranking = grid.map((config, index) => ({
      rank: index + 1,
      config,
      balanceScore:
        config.eurosPerPoint === 12_500 ? 90 - config.rosterCap / 100 : 50 - index / 100,
      dimensions: {
        economicEquality: 50,
        competitiveBalance: 50,
        naturalRecovery: 50,
        antiHoarding: 50,
        liquidity: 50,
        merit: 50,
        inflationControl: 50,
        practicality: 50,
      },
      isParetoOptimal: index % 13 === 0,
    }));
    const finalists = selectEmergentFinalists(ranking);

    expect(finalists).toHaveLength(24);
    expect(
      finalists
        .filter((config) => config.eurosPerPoint === 12_500)
        .map((config) => config.rosterCap)
    ).toEqual(Array.from({ length: 16 }, (_, index) => index + 10));
    expect(finalists.some((config) => config.configId === 's25-m20-inverse-10000')).toBe(true);
  });

  it('compares cap 15 against other caps using identical seeds', () => {
    const configs = [15, 20, 25].map(
      (cap) =>
        generateEmergentConfigurationGrid().find(
          (config) => config.rosterCap === cap && config.eurosPerPoint === 10_000
        )!
    );
    const runsByConfig = new Map(
      configs.map((config) => [
        config.configId,
        [11, 22, 33, 44].map((seed) =>
          summarizeEmergentRun(simulateEmergentSeason({ dataset, config, seed }))
        ),
      ])
    );
    const reports = configs.map((config) =>
      aggregateEmergentRuns(
        config,
        [11, 22, 33, 44].map((seed) => simulateEmergentSeason({ dataset, config, seed }))
      )
    );
    const analysis = buildCap15Analysis(buildEmergentRanking(reports), runsByConfig);

    expect(analysis).toHaveLength(1);
    expect(analysis[0].comparisons.map((comparison) => comparison.comparedCap)).toEqual([20, 25]);
    expect(analysis[0].comparisons.every((comparison) => comparison.sampleSize === 4)).toBe(true);
    expect(
      analysis[0].comparisons.every(
        (comparison) =>
          comparison.probabilityLowerInequality >= 0 && comparison.probabilityLowerInequality <= 1
      )
    ).toBe(true);
  });
});
