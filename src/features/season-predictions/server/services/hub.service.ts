import 'server-only';

import type { SeasonPredictionsHubData } from '../../models/hub';
import { mapSeasonPredictionsHub } from '../mappers/hub.mapper';
import { getPreseasonOutcomes } from '../queries/outcomes.query';
import {
  readPlayoffPredictions,
  readSeasonPredictions,
} from '../repositories/predictions.repository';

/** Same access and freshness policy as SEASON_PREDICTIONS_POLICY: member-only, uncached. */
export async function getSeasonPredictionsHub(
  seasonId: string,
  userId: string
): Promise<SeasonPredictionsHubData> {
  const [preseason, playoffs] = await Promise.all([
    readSeasonPredictions(seasonId, userId),
    readPlayoffPredictions(seasonId, userId),
  ]);
  const outcomes = preseason.status === 'locked' ? await getPreseasonOutcomes(seasonId) : null;
  return mapSeasonPredictionsHub({ preseason, playoffs, outcomes });
}
