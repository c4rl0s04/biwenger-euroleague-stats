import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/utils/cache', () => ({
  cached: async (_key: string, _ttl: number, fn: () => Promise<any>) => fn(),
  CACHE_TTL: { VERY_LONG: 86400 },
}));

const mockAnalyzeConfiguration = vi.fn();
const mockSimulationDataset = { rounds: [1, 2], users: [] };

vi.mock('./season-review.service', () => ({
  analyzeConfiguration: (...args: any[]) => mockAnalyzeConfiguration(...args),
  getCachedResilienceModel: vi.fn(async () => ({
    simulationDataset: mockSimulationDataset,
  })),
}));

import { simulateSeasonResilience } from './scenario-simulation.service';

describe('scenario-simulation.service', () => {
  it('rejects invalid config and shock inputs via zod schema validation', async () => {
    await expect(simulateSeasonResilience(null)).rejects.toThrow();
    await expect(
      simulateSeasonResilience({
        config: { rosterCap: 5 }, // too low (min 10)
        shock: { kind: 'bad-transfer' },
      })
    ).rejects.toThrow();
    await expect(
      simulateSeasonResilience({
        config: {
          rosterCap: 20,
          payoutDirection: 'invalid',
          eurosPerPoint: 10000,
          marketSlots: 15,
        },
        shock: { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
      })
    ).rejects.toThrow();
  });

  it('runs simulation with valid config and shock, returning analyzed configuration', async () => {
    const validPayload = {
      config: {
        rosterCap: 18,
        payoutDirection: 'inverse',
        eurosPerPoint: 10_000,
        marketSlots: 15,
      },
      shock: {
        kind: 'bad-transfer',
        severity: 'medium',
        appliedRound: 5,
      },
    };

    const mockAnalysisResult = {
      config: validPayload.config,
      shock: validPayload.shock,
      deltaRecoveryProbability: 0.12,
      scores: {
        resilience: 80,
        equality: 75,
        merit: 60,
        liquidity: 70,
        practicality: 85,
        overall: 76,
      },
    };

    mockAnalyzeConfiguration.mockReturnValue(mockAnalysisResult);

    const result = await simulateSeasonResilience(validPayload);

    expect(mockAnalyzeConfiguration).toHaveBeenCalledWith(
      mockSimulationDataset,
      validPayload.config,
      validPayload.shock
    );
    expect(result).toEqual(mockAnalysisResult);
  });
});
