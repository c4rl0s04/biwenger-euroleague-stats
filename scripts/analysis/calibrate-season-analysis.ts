import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pgClient } from '../../src/lib/db/index';
import { calibrateSeasonSimulator } from '../../src/lib/season-review/simulation-dataset';
import type { SimulationAnalysisArtifact } from '../../src/lib/season-review/simulation-types';
import { getSeasonResilienceOverview } from '../../src/lib/services/features/seasonResilienceService';

async function main() {
  const file = resolve(
    process.cwd(),
    process.env.SIMULATION_OUTPUT || 'src/data/season-simulation-analysis.json'
  );
  const artifact = JSON.parse(await readFile(file, 'utf8')) as SimulationAnalysisArtifact;
  if (artifact.version !== 4 || artifact.kind !== 'analysis' || artifact.status !== 'ready')
    throw new Error(`Invalid final analysis artifact: ${file}`);
  const historical = artifact.configurations.find(
    (item) => item.config.configId === 's25-m20-inverse-10000'
  );
  if (!historical) throw new Error('Historical configuration is required for calibration');
  const overview = await getSeasonResilienceOverview();
  artifact.calibration = calibrateSeasonSimulator(
    {
      transfers: overview.simulationCalibration.observedTransfers,
      finalResourceGini: overview.simulationCalibration.observedFinalResourceGini,
      finalSquadGini: overview.simulationCalibration.observedFinalSquadGini,
    },
    {
      medianTransactions: historical.metrics.marketTransactions.median,
      medianFinalResourceGini: historical.metrics.finalResourceGini.median,
      medianFinalSquadGini: historical.metrics.finalSquadGini.median,
    }
  );
  await writeFile(file, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  console.log(`Calibration ${artifact.calibration.status} written to ${file}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pgClient.end();
  });
