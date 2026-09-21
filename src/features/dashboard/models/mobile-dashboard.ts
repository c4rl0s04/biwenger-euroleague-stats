import type { MobileNewsInput } from '@/features/news/public';
import type {
  ManagerSeasonStatsViewModel,
  ManagerSquadViewModel,
} from '@/features/managers/public';
import type { DashboardDisplayPlayer } from './dashboard';

/** Minimal display inputs retain optional legacy fallback fields without an untyped record. */
export interface MobileDashboardInput {
  userDashboard: {
    seasonStats?: Partial<ManagerSeasonStatsViewModel>;
    squadDetails?: Partial<ManagerSquadViewModel>;
    alerts?: Array<{
      id?: string | number;
      title?: string;
      message?: string;
      severity?: string;
      type?: string;
    }>;
  };
  leagueDashboard: { leagueAverage?: number | null; hotStreaks?: DashboardDisplayPlayer[] };
  nextRoundData: {
    nextRound?: {
      round_id?: number | null;
      id?: number;
      round_name?: string | null;
      name?: string;
    } | null;
  };
  news: MobileNewsInput[];
}
