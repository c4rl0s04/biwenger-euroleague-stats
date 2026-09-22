import 'server-only';

import { cached, CACHE_TTL } from '@/lib/utils/cache';
import { resilienceRequestSchema } from '../engines/resilience';
import { analyzeConfiguration, getCachedResilienceModel } from './season-review.service';

export async function simulateSeasonResilience(input: unknown) {
  const request = resilienceRequestSchema.parse(input);
  const cacheKey = `season-review:resilience-simulation:v3:${JSON.stringify(request)}`;
  return cached(cacheKey, CACHE_TTL.VERY_LONG, async () => {
    const { simulationDataset } = await getCachedResilienceModel();
    return analyzeConfiguration(simulationDataset, request.config, request.shock);
  });
}
