import 'dotenv/config';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  EmergentArtifactRepository,
  publishEmergentCatalog,
  readEmergentRunSummaries,
  type EmergentCatalog,
  type EmergentCatalogEntry,
} from '../../src/lib/season-review/emergent-artifacts';
import { VercelBlobArtifactStore } from '../../src/lib/season-review/emergent-blob-store';
import { FileArtifactObjectStore } from '../../src/lib/season-review/emergent-file-store';
import {
  buildCap15Analysis,
  buildEmergentRanking,
} from '../../src/lib/season-review/emergent-simulation';
import type {
  EmergentConfigurationReport,
  EmergentRunSummary,
} from '../../src/lib/season-review/emergent-types';
import type { SimulationDatasetIdentity } from '../../src/lib/season-review/simulation-types';

interface ShardManifest {
  version: 5;
  stage: 'base' | 'final';
  generationId: string;
  generatedAt: string;
  dataset: SimulationDatasetIdentity;
  runs: number;
  shardIndex: number;
  shardCount: number;
  entries: EmergentCatalogEntry[];
  reports: EmergentConfigurationReport[];
}

function objectStore() {
  return process.env.BLOB_READ_WRITE_TOKEN
    ? new VercelBlobArtifactStore()
    : new FileArtifactObjectStore(
        process.env.EMERGENT_ARTIFACT_ROOT || resolve('artifacts/emergent-store')
      );
}

async function main() {
  const directory = resolve(process.env.EMERGENT_SHARD_INPUT || 'artifacts/emergent-v5');
  const files = (await readdir(directory, { recursive: true }))
    .filter((file) => file.endsWith('.json'))
    .map((file) => resolve(directory, file));
  if (!files.length) throw new Error(`No V5 shard manifests found in ${directory}`);
  const shards = await Promise.all(
    files.map(async (file) => JSON.parse(await readFile(file, 'utf8')) as ShardManifest)
  );
  const first = shards[0];
  shards.forEach((shard) => {
    if (shard.version !== 5 || shard.stage !== first.stage) throw new Error('Mixed V5 stages');
    if (shard.generationId !== first.generationId) throw new Error('Mixed V5 generations');
    if (shard.dataset.fingerprint !== first.dataset.fingerprint) throw new Error('Mixed datasets');
    if (shard.shardCount !== first.shardCount) throw new Error('Mixed shard counts');
  });
  if (new Set(shards.map((shard) => shard.shardIndex)).size !== first.shardCount)
    throw new Error(`Expected ${first.shardCount} shards`);

  const store = objectStore();
  const repository = new EmergentArtifactRepository(store);
  const entries = new Map<string, EmergentCatalogEntry>();
  const reports = new Map<string, EmergentConfigurationReport>();
  let previousCatalog: EmergentCatalog | null = null;
  if (first.stage === 'final') {
    previousCatalog = await repository.getCatalog();
    previousCatalog.configurations.forEach((entry) => entries.set(entry.config.configId, entry));
    for (const entry of previousCatalog.configurations) {
      const report = await repository.getReport(entry.config.configId);
      if (report) reports.set(entry.config.configId, report);
    }
  }
  for (const shard of shards) {
    for (const entry of shard.entries) entries.set(entry.config.configId, entry);
    shard.reports.forEach((report) => reports.set(report.config.configId, report));
  }
  if (entries.size !== 96 || reports.size !== 96)
    throw new Error(`A published V5 catalog requires 96 configurations; got ${entries.size}`);
  const ranking = buildEmergentRanking(Array.from(reports.values()));
  const summariesByConfig = new Map<string, EmergentRunSummary[]>();
  for (const entry of entries.values())
    summariesByConfig.set(entry.config.configId, await readEmergentRunSummaries(store, entry));
  const catalog: EmergentCatalog = {
    version: 5,
    modelVersion: 'agent-season-v5',
    generationId: first.generationId,
    generatedAt: new Date().toISOString(),
    dataset: first.dataset,
    baseRuns: previousCatalog?.baseRuns || first.runs,
    finalistRuns: first.stage === 'final' ? first.runs : first.runs,
    configurations: Array.from(entries.values()).sort((left, right) =>
      left.config.configId.localeCompare(right.config.configId)
    ),
    ranking,
    cap15Analysis: buildCap15Analysis(ranking, summariesByConfig),
  };
  await publishEmergentCatalog(store, catalog);
  console.log(
    `Published ${catalog.generationId} with ${catalog.configurations.length} configurations`
  );
}

await main();
