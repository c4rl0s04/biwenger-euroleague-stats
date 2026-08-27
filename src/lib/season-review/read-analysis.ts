import 'server-only';

import { readFile } from 'fs/promises';
import { join } from 'path';
import { cache } from 'react';

import { getSeasonResilienceOverview } from '@/lib/services';

import type { SimulationAnalysisArtifact } from './simulation-types';

export const readSeasonSimulationAnalysis = cache(async (): Promise<SimulationAnalysisArtifact> => {
  const jsonPath = join(process.cwd(), 'src/data/season-simulation-analysis.json');
  return JSON.parse(await readFile(jsonPath, 'utf8')) as SimulationAnalysisArtifact;
});

export const getSeasonReviewPageData = cache(async () => {
  const [overview, simulationAnalysis] = await Promise.all([
    getSeasonResilienceOverview(),
    readSeasonSimulationAnalysis(),
  ]);
  return { overview, simulationAnalysis };
});
