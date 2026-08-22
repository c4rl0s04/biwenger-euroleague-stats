import { describe, expect, it } from 'vitest';
import { generateEmergentConfigurationGrid, simulateEmergentSeason } from './emergent-simulation';
import {
  EmergentArtifactRepository,
  publishEmergentGeneration,
  toPublicEmergentCatalog,
  type ArtifactObjectStore,
} from './emergent-artifacts';
import type { SeasonSimulationDataset } from './simulation-types';

class MemoryObjectStore implements ArtifactObjectStore {
  readonly objects = new Map<string, Uint8Array>();

  async put(key: string, value: Uint8Array) {
    this.objects.set(key, value);
  }

  async get(key: string) {
    return this.objects.get(key) || null;
  }
}

const dataset: SeasonSimulationDataset = {
  startingBudget: 40_000_000,
  userCount: 3,
  initialRosterSize: 2,
  lineupSize: 2,
  lineupPositionTargets: { base: 1, pivot: 1 },
  marketDaysPerRound: 1,
  rounds: [1, 2, 3],
  players: Array.from({ length: 18 }, (_, index) => ({
    id: String(index + 1),
    position: ['base', 'alero', 'pivot'][index % 3],
    initialPrice: 600_000 + index * 50_000,
    roundPoints: [8 + index, 10 + index, 12 + index],
    priceChanges: [0.01, -0.01, 0.02],
  })),
};

describe('emergent V5 artifact repository', () => {
  it('publishes compact statistical samples without storing individual runs', async () => {
    const store = new MemoryObjectStore();
    const config = generateEmergentConfigurationGrid()[0];
    const runs = Array.from({ length: 33 }, (_, index) =>
      simulateEmergentSeason({ dataset, config, seed: 1_000 + index })
    );

    await publishEmergentGeneration({
      store,
      generationId: 'fixture-generation',
      dataset: {
        seasonId: '2025-26',
        fingerprint: 'fixture-fingerprint',
        players: dataset.players.length,
        rounds: dataset.rounds.length,
        users: dataset.userCount,
      },
      reports: [],
      runsByConfig: new Map([[config.configId, runs]]),
      ranking: [],
      baseRuns: 2_048,
      finalistRuns: 8_192,
      generatedAt: '2026-08-21T12:00:00.000Z',
    });

    const repository = new EmergentArtifactRepository(store);
    const catalog = await repository.getCatalog();
    const firstPage = await repository.listRuns(config.configId, { limit: 20 });

    expect(catalog.generationId).toBe('fixture-generation');
    expect(catalog.configurations).toHaveLength(1);
    expect(toPublicEmergentCatalog(catalog).configurations[0]).toEqual({
      config,
      sampleSize: 33,
    });
    expect(firstPage).toEqual({ data: [], nextCursor: null, total: 0 });
    expect(Array.from(store.objects.keys()).some((key) => key.includes('/runs/'))).toBe(false);
    expect(Array.from(store.objects.keys()).filter((key) => key.endsWith('.json.gz'))).toHaveLength(
      1
    );
  });

  it('does not expose a generation before the latest manifest exists', async () => {
    const store = new MemoryObjectStore();
    const repository = new EmergentArtifactRepository(store);

    await expect(repository.getCatalog()).rejects.toThrow('No published V5 generation');
  });
});
