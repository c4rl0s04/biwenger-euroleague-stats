import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type {
  SeasonSimulationArtifact,
  SeasonSimulationArtifactEntry,
} from '../../src/lib/season-review/simulation-types';

const inputDirectory = resolve(
  process.cwd(),
  process.env.SIMULATION_INPUT || 'artifacts/downloaded'
);
const output = resolve(
  process.cwd(),
  process.env.SIMULATION_OUTPUT || 'src/data/season-simulation-results.json'
);

const keyOf = (entry: SeasonSimulationArtifactEntry) =>
  JSON.stringify({ config: entry.config, shock: entry.shock });

async function main() {
  const files = (await readdir(inputDirectory, { recursive: true }))
    .filter((file) => file.endsWith('.json'))
    .map((file) => resolve(inputDirectory, file));
  if (!files.length) throw new Error(`No simulation artifacts found in ${inputDirectory}`);
  const artifacts = await Promise.all(
    files.map(async (file) => JSON.parse(await readFile(file, 'utf8')) as SeasonSimulationArtifact)
  );
  const entries = new Map<string, SeasonSimulationArtifactEntry>();
  artifacts.forEach((artifact) =>
    artifact.results.forEach((entry) => entries.set(keyOf(entry), entry))
  );
  const merged: SeasonSimulationArtifact = {
    version: 3,
    status: 'ready',
    generatedAt: new Date().toISOString(),
    runsPerConfiguration: Math.min(...artifacts.map((artifact) => artifact.runsPerConfiguration)),
    dataset: artifacts.find((artifact) => artifact.dataset)?.dataset || null,
    results: Array.from(entries.values()),
  };
  await writeFile(output, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  console.log(`Merged ${merged.results.length} results into ${output}`);
}

await main();
