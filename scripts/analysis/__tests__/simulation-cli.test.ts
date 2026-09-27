import { describe, expect, it } from 'vitest';
import {
  generateConfigurationGrid,
  generateSeedManifest,
  simulatePairedSeason,
  aggregateConfigurationRuns,
  buildSimulationRanking,
  selectSimulationShortlist,
  calibrateSeasonSimulator,
} from '@/features/season-review/server';
import { hoopgridCommandService } from '@/features/hoopgrid/server';
import type { SeasonSimulationDataset } from '@/features/season-review/public';

describe('Task 21 — Offline Simulation & Generation CLI Test Suite', () => {
  describe('Season Review Simulation Grid Generator', () => {
    it('generates a deterministic grid of simulation configurations', () => {
      const grid = generateConfigurationGrid();
      expect(grid.length).toBeGreaterThan(0);

      // Verify structure of first config
      const first = grid[0];
      expect(first).toHaveProperty('configId');
      expect(first).toHaveProperty('rosterCap');
      expect(first).toHaveProperty('marketSlots');
      expect(first).toHaveProperty('payoutDirection');
      expect(first).toHaveProperty('eurosPerPoint');

      // Verify roster bounds (10 to 25)
      expect(first.rosterCap).toBeGreaterThanOrEqual(10);
      expect(first.rosterCap).toBeLessThanOrEqual(25);
    });

    it('produces unique configuration IDs across the grid', () => {
      const grid = generateConfigurationGrid();
      const configIds = new Set(grid.map((c) => c.configId));
      expect(configIds.size).toBe(grid.length);
    });
  });

  describe('Simulation Ranking & Shortlist Selection', () => {
    const miniDataset: SeasonSimulationDataset = {
      startingBudget: 10_000_000,
      userCount: 2,
      initialRosterSize: 2,
      lineupSize: 2,
      lineupPositionTargets: { base: 1, pivot: 1 },
      marketDaysPerRound: 1,
      rounds: [1, 2],
      players: [
        {
          id: '1',
          position: 'base',
          initialPrice: 1_000_000,
          roundPoints: [10, 12],
          priceChanges: [0.01, 0.01],
        },
        {
          id: '2',
          position: 'pivot',
          initialPrice: 1_000_000,
          roundPoints: [8, 9],
          priceChanges: [0.01, 0.01],
        },
        {
          id: '3',
          position: 'base',
          initialPrice: 1_000_000,
          roundPoints: [11, 10],
          priceChanges: [0.01, 0.01],
        },
        {
          id: '4',
          position: 'pivot',
          initialPrice: 1_000_000,
          roundPoints: [7, 8],
          priceChanges: [0.01, 0.01],
        },
      ],
    };

    it('builds rankings across generated simulation configuration aggregates', () => {
      const manifest = generateSeedManifest({ pairs: 2, baseSeed: 10_000, rounds: 2 });
      const configs = [
        {
          configId: 'cfg-a',
          rosterCap: 2,
          marketSlots: 2,
          payoutDirection: 'inverse' as const,
          eurosPerPoint: 7_500,
        },
        {
          configId: 'cfg-b',
          rosterCap: 4,
          marketSlots: 4,
          payoutDirection: 'direct' as const,
          eurosPerPoint: 10_000,
        },
      ];

      const aggregates = configs.map((config) =>
        aggregateConfigurationRuns(
          config,
          manifest.map((entry) =>
            simulatePairedSeason({ dataset: miniDataset, config, manifest: entry })
          )
        )
      );

      const ranking = buildSimulationRanking(aggregates);
      expect(ranking).toBeDefined();
      expect(ranking.profiles).toHaveLength(5);
      expect(ranking.paretoConfigIds.length).toBeGreaterThan(0);

      const shortlist = selectSimulationShortlist(ranking, 1);
      expect(shortlist).toHaveLength(1);
      expect(configs.map((c) => c.configId)).toContain(shortlist[0]);
    });
  });

  describe('Simulation Calibration Algorithm', () => {
    it('calibrates observed versus simulated metrics accurately', () => {
      const observed = {
        transfers: 500,
        finalResourceGini: 0.25,
        finalSquadGini: 0.3,
      };

      const simulatedClose = {
        medianTransactions: 510,
        medianFinalResourceGini: 0.26,
        medianFinalSquadGini: 0.31,
      };

      const calibratedResult = calibrateSeasonSimulator(observed, simulatedClose);
      expect(['strong', 'acceptable']).toContain(calibratedResult.status);
      expect(calibratedResult.transferRelativeError).toBeLessThan(0.3);

      const simulatedFar = {
        medianTransactions: 1500,
        medianFinalResourceGini: 0.8,
        medianFinalSquadGini: 0.9,
      };

      const uncalibratedResult = calibrateSeasonSimulator(observed, simulatedFar);
      expect(uncalibratedResult.status).toBe('weak');
      expect(uncalibratedResult.transferRelativeError).toBeGreaterThan(0.3);
    });
  });

  describe('Hoopgrid Complexity Computation CLI Integration', () => {
    it('computes complexity correctly across various count formats', () => {
      // Null or empty returns 0
      expect(hoopgridCommandService.calculateComplexity(null)).toBe(0);
      expect(hoopgridCommandService.calculateComplexity([])).toBe(0);
      expect(hoopgridCommandService.calculateComplexity('[]')).toBe(0);

      // Single cell with 1 solution (maximum difficulty)
      expect(hoopgridCommandService.calculateComplexity([1])).toBe(100);

      // JSON stringified counts
      expect(hoopgridCommandService.calculateComplexity('[1, 2, 3]')).toBeGreaterThan(0);
    });
  });
});
