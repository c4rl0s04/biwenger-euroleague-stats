import type { InitialSquadAnalytics, InitialSquadStatsBundle } from '../../models/draft';
import type {
  InitialSquadAnalyticsRecord,
  InitialSquadStatsBundleRecord,
} from '../queries/draft.records';

export const mapInitialSquadAnalytics = (row: InitialSquadAnalyticsRecord): InitialSquadAnalytics =>
  row;
export const mapInitialSquadStatsBundle = (
  row: InitialSquadStatsBundleRecord
): InitialSquadStatsBundle => row;
