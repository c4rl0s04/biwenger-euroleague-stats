import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pgClient } from '../../src/lib/db/index';
import { getSeasonReviewRawData } from '../../src/lib/db/queries/analytics/season-review';
import {
  EmergentConfigurationArtifactWriter,
  EmergentArtifactRepository,
  readEmergentSamples,
  type EmergentCatalogEntry,
} from '../../src/lib/season-review/emergent-artifacts';
import { VercelBlobArtifactStore } from '../../src/lib/season-review/emergent-blob-store';
import { FileArtifactObjectStore } from '../../src/lib/season-review/emergent-file-store';
import {
  aggregateEmergentSamples,
  EMERGENT_BASE_RUNS,
  EMERGENT_FINALIST_RUNS,
  emergentSeedForRun,
  generateEmergentConfigurationGrid,
  sampleEmergentRun,
  selectEmergentFinalists,
  simulateEmergentSeason,
} from '../../src/lib/season-review/emergent-simulation';
import { buildSeasonSimulationDataset } from '../../src/lib/season-review/simulation-dataset';
import type {
  EmergentConfigurationReport,
  EmergentRunSample,
} from '../../src/lib/season-review/emergent-types';
import type { SimulationDatasetIdentity } from '../../src/lib/season-review/simulation-types';

type Stage = 'base' | 'final';

function integer(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function objectStore() {
  return process.env.BLOB_READ_WRITE_TOKEN
    ? new VercelBlobArtifactStore()
    : new FileArtifactObjectStore(
        process.env.EMERGENT_ARTIFACT_ROOT || resolve('artifacts/emergent-store')
      );
}

async function main() {
  const stage = (process.env.EMERGENT_STAGE || 'base') as Stage;
  if (stage !== 'base' && stage !== 'final')
    throw new Error('EMERGENT_STAGE must be base or final');
  const runs = integer(
    'EMERGENT_RUNS',
    stage === 'base' ? EMERGENT_BASE_RUNS : EMERGENT_FINALIST_RUNS
  );
  const firstRunIndex = stage === 'base' ? 0 : EMERGENT_BASE_RUNS;
  if (runs <= firstRunIndex)
    throw new Error(`EMERGENT_RUNS must exceed ${firstRunIndex} during the ${stage} stage`);
  const shardIndex = integer('EMERGENT_SHARD_INDEX', 0);
  const shardCount = Math.max(1, integer('EMERGENT_SHARD_COUNT', 1));
  if (shardIndex >= shardCount) throw new Error('EMERGENT_SHARD_INDEX must be below shard count');
  const generationId =
    process.env.EMERGENT_GENERATION_ID ||
    `v5-${stage}-${new Date().toISOString().replaceAll(/[:.]/g, '-')}`;
  if (shardCount > 1 && !process.env.EMERGENT_GENERATION_ID)
    throw new Error('EMERGENT_GENERATION_ID is required for sharded runs');
  const store = objectStore();
  const repository = new EmergentArtifactRepository(store);
  const grid = generateEmergentConfigurationGrid();
  const previousCatalog = stage === 'final' ? await repository.getCatalog() : null;
  const selected =
    stage === 'base' ? grid : selectEmergentFinalists(previousCatalog?.ranking || []);
  const configurations = selected.filter((_config, index) => index % shardCount === shardIndex);
  const raw = await getSeasonReviewRawData();
  const dataset = buildSeasonSimulationDataset(raw);
  const identity: SimulationDatasetIdentity = {
    seasonId: '2025-26',
    fingerprint: createHash('sha256').update(JSON.stringify(dataset)).digest('hex'),
    players: dataset.players.length,
    rounds: dataset.rounds.length,
    users: dataset.userCount,
  };
  const entries: EmergentCatalogEntry[] = [];
  const reports: EmergentConfigurationReport[] = [];

  for (let configIndex = 0; configIndex < configurations.length; configIndex += 1) {
    const config = configurations[configIndex];
    console.log(
      `[V5 ${stage} ${shardIndex + 1}/${shardCount}] ${configIndex + 1}/${configurations.length} ${config.configId} · ${runs} temporadas`
    );
    const writer = new EmergentConfigurationArtifactWriter(store, generationId, config);
    const previousEntry = previousCatalog?.configurations.find(
      (entry) => entry.config.configId === config.configId
    );
    const samples: EmergentRunSample[] = previousEntry
      ? await readEmergentSamples(store, previousEntry)
      : [];
    if (stage === 'final' && samples.length !== EMERGENT_BASE_RUNS)
      throw new Error(
        `${config.configId} has ${samples.length} base samples; expected ${EMERGENT_BASE_RUNS}`
      );
    for (let runIndex = firstRunIndex; runIndex < runs; runIndex += 1) {
      const seed = emergentSeedForRun(runIndex);
      const run = simulateEmergentSeason({ dataset, config, seed });
      samples.push(sampleEmergentRun(run));
      await writer.append(run);
      if ((runIndex - firstRunIndex + 1) % 256 === 0) console.log(`  ${runIndex + 1}/${runs}`);
    }
    const report = aggregateEmergentSamples(config, samples);
    entries.push(await writer.finish(report, samples));
    reports.push({ ...report, runSummaries: [] });
  }

  const output = resolve(
    process.env.EMERGENT_SHARD_OUTPUT ||
      join('artifacts', 'emergent-v5', generationId, `shard-${shardIndex}.json`)
  );
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    `${JSON.stringify({
      version: 5,
      stage,
      generationId,
      generatedAt: new Date().toISOString(),
      dataset: identity,
      runs,
      shardIndex,
      shardCount,
      entries,
      reports,
    })}\n`,
    'utf8'
  );
  console.log(`Written shard manifest: ${output}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => pgClient.end());
