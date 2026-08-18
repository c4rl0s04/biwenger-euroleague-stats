import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  buildSimulationRanking,
  selectSimulationShortlist,
} from '../../src/lib/season-review/simulation-analysis';
import type {
  SimulationAnalysisArtifact,
  SimulationAnalysisShardArtifact,
  SimulationAnalysisStage,
} from '../../src/lib/season-review/simulation-types';

const inputDirectory = resolve(
  process.cwd(),
  process.env.SIMULATION_INPUT || 'artifacts/analysis-shards'
);
const output = resolve(
  process.cwd(),
  process.env.SIMULATION_OUTPUT || 'src/data/season-simulation-analysis.json'
);

function stage(value: string | undefined): SimulationAnalysisStage {
  if (value === 'screen' || value === 'refine' || value === 'final') return value;
  throw new Error('SIMULATION_STAGE must be screen, refine, or final');
}

function parseShard(value: unknown, file: string): SimulationAnalysisShardArtifact {
  const artifact = value as Partial<SimulationAnalysisShardArtifact>;
  if (
    artifact.version !== 4 ||
    artifact.kind !== 'shard' ||
    !artifact.dataset ||
    !Array.isArray(artifact.aggregates)
  )
    throw new Error(`Invalid simulation shard: ${file}`);
  return artifact as SimulationAnalysisShardArtifact;
}

async function main() {
  const selectedStage = stage(process.env.SIMULATION_STAGE || 'screen');
  const files = (await readdir(inputDirectory, { recursive: true }))
    .filter((file) => file.endsWith('.json'))
    .map((file) => resolve(inputDirectory, file));
  if (!files.length) throw new Error(`No simulation shards found in ${inputDirectory}`);
  const shards = await Promise.all(
    files.map(async (file) => parseShard(JSON.parse(await readFile(file, 'utf8')), file))
  );
  const first = shards[0];
  shards.forEach((shard) => {
    if (shard.stage !== selectedStage) throw new Error('Cannot merge different analysis stages');
    if (shard.dataset.fingerprint !== first.dataset.fingerprint)
      throw new Error('Cannot merge different simulation datasets');
    if (shard.pairCount !== first.pairCount)
      throw new Error('Cannot merge shards with different pair counts');
    if (shard.shardCount !== first.shardCount)
      throw new Error('Cannot merge shards with different shard counts');
  });
  const receivedShards = new Set(shards.map((shard) => shard.shardIndex));
  if (receivedShards.size !== first.shardCount)
    throw new Error(`Expected ${first.shardCount} shards, received ${receivedShards.size}`);
  const configurations = shards
    .flatMap((shard) => shard.aggregates)
    .sort((left, right) => left.config.configId.localeCompare(right.config.configId));
  if (new Set(configurations.map((item) => item.config.configId)).size !== configurations.length)
    throw new Error('Duplicate configuration aggregates detected');
  const ranking = buildSimulationRanking(configurations);
  const defaultLimit = selectedStage === 'screen' ? 120 : 24;
  const shortlistLimit = Math.max(
    1,
    Number(process.env.SIMULATION_SHORTLIST_LIMIT || defaultLimit)
  );
  const shortlistConfigIds = selectSimulationShortlist(ranking, shortlistLimit);
  const artifact: SimulationAnalysisArtifact = {
    version: 4,
    kind: 'analysis',
    status: 'ready',
    modelVersion: 'agent-season-v4',
    stage: selectedStage,
    generatedAt: new Date().toISOString(),
    dataset: first.dataset,
    pairCount: first.pairCount,
    configurationCount: configurations.length,
    configurations,
    ranking,
    shortlistConfigIds,
    calibration: null,
  };
  await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  console.log(
    `Merged ${configurations.length} configurations; selected ${shortlistConfigIds.length} into ${output}`
  );
}

await main();
