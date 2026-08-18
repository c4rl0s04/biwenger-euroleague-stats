import 'dotenv/config';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pgClient } from '../../src/lib/db/index';
import { getSeasonReviewRawData } from '../../src/lib/db/queries/analytics/season-review';
import {
  aggregateConfigurationSamples,
  generateConfigurationGrid,
  generateSeedManifest,
  simulatePairedSeason,
  summarizePairedSeason,
} from '../../src/lib/season-review/simulation-analysis';
import { buildSeasonSimulationDataset } from '../../src/lib/season-review/simulation-dataset';
import type {
  SimulationAnalysisArtifact,
  SimulationAnalysisShardArtifact,
  SimulationAnalysisStage,
} from '../../src/lib/season-review/simulation-types';

function requiredInteger(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

function analysisStage(value: string | undefined): SimulationAnalysisStage {
  if (value === 'screen' || value === 'refine' || value === 'final') return value;
  throw new Error('SIMULATION_STAGE must be screen, refine, or final');
}

async function readShortlist(file: string) {
  const parsed = JSON.parse(await readFile(file, 'utf8')) as Partial<SimulationAnalysisArtifact>;
  if (
    parsed.version !== 4 ||
    parsed.kind !== 'analysis' ||
    !Array.isArray(parsed.shortlistConfigIds)
  )
    throw new Error(`Invalid analysis artifact: ${file}`);
  return new Set(parsed.shortlistConfigIds);
}

async function main() {
  const stage = analysisStage(process.env.SIMULATION_STAGE || 'screen');
  const pairCount = Math.max(1, requiredInteger('SIMULATION_PAIRS', 64));
  const shardIndex = requiredInteger('SIMULATION_SHARD_INDEX', 0);
  const shardCount = Math.max(1, requiredInteger('SIMULATION_SHARD_COUNT', 1));
  if (shardIndex >= shardCount) throw new Error('SIMULATION_SHARD_INDEX must be below shard count');
  const output = resolve(
    process.cwd(),
    process.env.SIMULATION_OUTPUT || `artifacts/${stage}-shard-${shardIndex}.json`
  );
  const grid = generateConfigurationGrid();
  const selectedIds =
    stage === 'screen'
      ? null
      : await readShortlist(
          resolve(process.cwd(), process.env.SIMULATION_INPUT || `artifacts/${stage}-input.json`)
        );
  const selected = selectedIds ? grid.filter((config) => selectedIds.has(config.configId)) : grid;
  if (!selected.length) throw new Error(`No configurations selected for ${stage}`);
  const diagnosticLimit = process.env.SIMULATION_CONFIG_LIMIT
    ? Math.max(1, requiredInteger('SIMULATION_CONFIG_LIMIT', selected.length))
    : selected.length;
  const configurations = selected
    .slice(0, diagnosticLimit)
    .filter((_config, index) => index % shardCount === shardIndex);
  const raw = await getSeasonReviewRawData();
  const dataset = buildSeasonSimulationDataset(raw);
  const fingerprint = createHash('sha256').update(JSON.stringify(dataset)).digest('hex');
  const manifest = generateSeedManifest({
    pairs: pairCount,
    baseSeed: 202_526,
    rounds: dataset.rounds.length,
  });
  const aggregates = [];

  for (let index = 0; index < configurations.length; index += 1) {
    const config = configurations[index];
    console.log(
      `[${stage}:${shardIndex + 1}/${shardCount}] ${index + 1}/${configurations.length} ${config.configId} · ${pairCount} pares`
    );
    const samples = manifest.map((entry) =>
      summarizePairedSeason(simulatePairedSeason({ dataset, config, manifest: entry }))
    );
    aggregates.push(aggregateConfigurationSamples(config, samples));
  }

  const artifact: SimulationAnalysisShardArtifact = {
    version: 4,
    kind: 'shard',
    modelVersion: 'agent-season-v4',
    stage,
    generatedAt: new Date().toISOString(),
    dataset: {
      seasonId: '2025-26',
      fingerprint,
      players: dataset.players.length,
      rounds: dataset.rounds.length,
      users: dataset.userCount,
    },
    pairCount,
    shardIndex,
    shardCount,
    configurationCount: aggregates.length,
    aggregates,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  console.log(`Written ${aggregates.length} configurations to ${output}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pgClient.end();
  });
