import 'server-only';
import {
  getAchievements,
  getParticipation,
  getPerformanceData,
  getTableStats,
  getClutchStats,
  getVictorias,
  getBestRoundStat,
  getHistoryPivot,
} from '../calculations/predictions';
import { readNormalizedPredictions, readPredictableTeams } from '../queries/predictions.query';
import { mapNormalizedPrediction, mapPredictableTeam } from '../mappers/predictions.mapper';
import type { PorrasStats } from '../../models/predictions';

export const PREDICTION_READ_POLICY = Object.freeze({
  access: 'competition statistics; existing page/caller authorization unchanged',
  serverCache: 'none; independent season resolution for each query',
  httpCache: 'no owned HTTP route; existing page revalidate remains 300',
  mutations: 'none',
});
export async function getNormalizedPredictions() {
  return (await readNormalizedPredictions()).map(mapNormalizedPrediction);
}
export async function getPredictableTeams() {
  return (await readPredictableTeams()).map(mapPredictableTeam);
}

export async function getPorrasStats(): Promise<PorrasStats> {
  // 1. Fetch normalized data once
  const normalizedData = await getNormalizedPredictions();

  // 2. Parallelize processing of normalized data
  const [achievements, participation, tableStats, performance, history] = await Promise.all([
    getAchievements(normalizedData),
    getParticipation(normalizedData),
    getTableStats(normalizedData),
    getPerformanceData(normalizedData),
    getHistoryPivot(normalizedData),
  ]);

  const clutch = await getClutchStats(normalizedData);
  const victories = await getVictorias(normalizedData);
  const predictable = await getPredictableTeams(); // Match-based, keep separate query
  const bestRound = await getBestRoundStat(normalizedData);

  return {
    achievements,
    participation,
    table_stats: tableStats,
    performance,
    history,
    clutch_stats: clutch,
    porra_stats: {
      victorias: victories,
      predictable_teams: predictable,
      promedios: tableStats,
      mejor_jornada: bestRound,
    },
  };
}
