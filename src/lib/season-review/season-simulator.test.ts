import { describe, expect, it } from 'vitest';
import {
  runConfigurationExperiment,
  runSeasonMonteCarlo,
  simulateSeason,
} from './season-simulator';
import type { SeasonSimulationDataset } from './simulation-types';

const dataset: SeasonSimulationDataset = {
  startingBudget: 40_000_000,
  userCount: 3,
  initialRosterSize: 2,
  lineupSize: 2,
  marketDaysPerRound: 2,
  rounds: [1, 2, 3, 4],
  players: Array.from({ length: 12 }, (_, index) => ({
    id: String(index + 1),
    position: ['base', 'alero', 'pivot'][index % 3],
    initialPrice: 1_000_000 + index * 100_000,
    roundPoints: [10 + index, 12 + index, 8 + index, 14 + index],
    priceChanges: [0.02, -0.01, 0.03, 0.01],
  })),
};

describe('complete season simulator', () => {
  it('runs a reproducible player-level season from equal 40M starting resources', () => {
    const request = {
      dataset,
      config: {
        rosterCap: 3,
        payoutDirection: 'inverse' as const,
        eurosPerPoint: 10_000,
        marketSlots: 4,
      },
      shock: { kind: 'bad-transfer' as const, severity: 'medium' as const, appliedRound: 2 },
      seed: 42,
    };

    const first = simulateSeason(request);
    const repeated = simulateSeason(request);

    expect(repeated).toEqual(first);
    expect(first.timeline[0].users.map((user) => user.totalResources)).toEqual([
      40_000_000, 40_000_000, 40_000_000,
    ]);
    expect(first.timeline).toHaveLength(5);
    expect(first.timeline.at(-1)?.users.every((user) => user.rosterSize <= 3)).toBe(true);
    expect(first.transactions.length).toBeGreaterThan(0);
    expect(first.timeline.at(-1)?.users.some((user) => user.points > 0)).toBe(true);
  });

  it('compares configurations over the same reproducible season sample', () => {
    const configs = [
      { rosterCap: 3, payoutDirection: 'inverse' as const, eurosPerPoint: 10_000, marketSlots: 4 },
      { rosterCap: 2, payoutDirection: 'direct' as const, eurosPerPoint: 7_500, marketSlots: 2 },
    ];
    const shock = { kind: 'bad-streak' as const, severity: 'medium' as const, appliedRound: 2 };

    const experiment = runConfigurationExperiment(dataset, configs, shock, {
      runs: 12,
      baseSeed: 900,
    });

    expect(experiment.baseSeed).toBe(900);
    expect(experiment.runs).toBe(12);
    expect(experiment.configurations).toHaveLength(2);
    expect(experiment.configurations.every((entry) => entry.result.simulationCount === 12)).toBe(
      true
    );
    expect(
      runConfigurationExperiment(dataset, configs, shock, { runs: 12, baseSeed: 900 })
    ).toEqual(experiment);
  });

  it('reports statistical uncertainty and calibration metrics for the season sample', () => {
    const result = runSeasonMonteCarlo(
      dataset,
      { rosterCap: 3, payoutDirection: 'inverse', eurosPerPoint: 10_000, marketSlots: 4 },
      { kind: 'star-injury', severity: 'medium', appliedRound: 2 },
      { runs: 40, baseSeed: 1200 }
    );

    expect(result.recoveryInterval95[0]).toBeLessThanOrEqual(result.recoveryProbability);
    expect(result.recoveryInterval95[1]).toBeGreaterThanOrEqual(result.recoveryProbability);
    expect(result.medianTransactions).toBeGreaterThan(0);
    expect(result.medianFinalResourceGap).toBeGreaterThanOrEqual(0);
  });

  it('turns a medium bad transfer into a material economic setback before measuring recovery', () => {
    const outcome = simulateSeason({
      dataset,
      config: {
        rosterCap: 3,
        payoutDirection: 'inverse',
        eurosPerPoint: 10_000,
        marketSlots: 4,
      },
      shock: { kind: 'bad-transfer', severity: 'medium', appliedRound: 2 },
      seed: 42,
    });
    const shockPoint = outcome.timeline.find((point) => point.round === 2);
    const target = shockPoint?.users.find((user) => user.userId === outcome.recovery.targetUserId);
    const resources = shockPoint?.users.map((user) => user.totalResources).sort((a, b) => a - b);
    const leagueMedian = resources?.[1] || 0;

    expect(target?.totalResources).toBeLessThan(leagueMedian * 0.9);
  });

  it('applies shocks by season order instead of provider round identifiers', () => {
    const outcome = simulateSeason({
      dataset: { ...dataset, rounds: [4746, 4747, 4810, 4811] },
      config: {
        rosterCap: 3,
        payoutDirection: 'inverse',
        eurosPerPoint: 10_000,
        marketSlots: 4,
      },
      shock: { kind: 'bad-transfer', severity: 'medium', appliedRound: 2 },
      seed: 42,
    });

    expect(outcome.timeline.map((point) => point.round)).toEqual([0, 1, 2, 3, 4]);
    expect(
      outcome.transactions.some(
        (transaction) =>
          transaction.round === 2 && transaction.userId === outcome.recovery.targetUserId
      )
    ).toBe(true);
  });
});
