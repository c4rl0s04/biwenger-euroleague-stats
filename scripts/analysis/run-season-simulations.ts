import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pgClient } from '@/lib/db';
import {
  getSeasonReviewRawData,
  buildSeasonSimulationDataset,
  runSeasonMonteCarlo,
} from '@/features/season-review/server';
import type {
  SeasonSimulationArtifact,
  SeasonSimulationArtifactEntry,
  ResilienceConfig,
  ShockConfig,
} from '@/features/season-review/public';

const historical: ResilienceConfig = {
  rosterCap: 25,
  payoutDirection: 'inverse',
  eurosPerPoint: 10_000,
  marketSlots: 20,
};

function configurationGroup(group: string): ResilienceConfig[] {
  if (group === 'roster-low')
    return Array.from({ length: 8 }, (_, index) => ({ ...historical, rosterCap: 10 + index }));
  if (group === 'roster-high')
    return Array.from({ length: 8 }, (_, index) => ({ ...historical, rosterCap: 18 + index }));
  if (group === 'payout')
    return (['direct', 'inverse'] as const).flatMap((payoutDirection) =>
      [5_000, 7_500, 10_000].map((eurosPerPoint) => ({
        ...historical,
        payoutDirection,
        eurosPerPoint,
      }))
    );
  if (group === 'market')
    return [5, 10, 15, 20].map((marketSlots) => ({ ...historical, marketSlots }));
  if (group === 'presets')
    return [
      historical,
      { ...historical, rosterCap: 13 },
      { ...historical, rosterCap: 18 },
      {
        rosterCap: 14,
        payoutDirection: 'direct',
        eurosPerPoint: 7_500,
        marketSlots: 20,
      },
    ];
  throw new Error(`Unknown SIMULATION_GROUP: ${group}`);
}

const shocks: ShockConfig[] = [
  { kind: 'bad-transfer', severity: 'medium', appliedRound: 5 },
  { kind: 'bad-streak', severity: 'medium', appliedRound: 5 },
  { kind: 'star-injury', severity: 'medium', appliedRound: 5 },
  { kind: 'inactivity', severity: 'medium', appliedRound: 5 },
];

async function main() {
  const group = process.env.SIMULATION_GROUP || 'presets';
  const runs = Math.max(10, Number(process.env.SIMULATION_RUNS || 500));
  const output = resolve(
    process.cwd(),
    process.env.SIMULATION_OUTPUT || `artifacts/season-simulations-${group}.json`
  );
  const raw = await getSeasonReviewRawData();
  const dataset = buildSeasonSimulationDataset(raw);
  const entries: SeasonSimulationArtifactEntry[] = [];
  const configurations = configurationGroup(group);

  for (let configIndex = 0; configIndex < configurations.length; configIndex += 1) {
    const config = configurations[configIndex];
    for (let shockIndex = 0; shockIndex < shocks.length; shockIndex += 1) {
      const shock = shocks[shockIndex];
      console.log(
        `[${group}] ${configIndex + 1}/${configurations.length} · ${shock.kind} · ${runs} temporadas`
      );
      entries.push({
        config,
        shock,
        result: runSeasonMonteCarlo(dataset, config, shock, {
          runs,
          baseSeed: 202526 + shockIndex * 100_000,
        }),
      });
    }
  }

  const artifact: SeasonSimulationArtifact = {
    version: 3,
    status: 'ready',
    generatedAt: new Date().toISOString(),
    runsPerConfiguration: runs,
    dataset: {
      players: dataset.players.length,
      rounds: dataset.rounds.length,
      users: dataset.userCount,
    },
    results: entries,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  console.log(`Written ${entries.length} results to ${output}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pgClient.end();
  });
