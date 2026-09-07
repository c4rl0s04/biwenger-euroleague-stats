import 'server-only';
import { mapInitialSquadAnalytics, mapInitialSquadStatsBundle } from '../mappers/draft.mapper';
import { queryInitialSquadAnalytics, queryInitialSquadStatsBundle } from '../queries/draft.query';

export async function fetchInitialSquadAnalytics() {
  return mapInitialSquadAnalytics(await queryInitialSquadAnalytics());
}

export async function fetchInitialSquadStats() {
  return mapInitialSquadStatsBundle(await queryInitialSquadStatsBundle());
}
