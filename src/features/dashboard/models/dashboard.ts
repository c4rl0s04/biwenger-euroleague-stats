import type {
  ManagerSeasonStatsViewModel,
  ManagerSquadViewModel,
  ManagerCaptainStats,
  ManagerHomeAwayStats,
  ManagerPersonalizedAlert,
  ManagerCaptainRecommendation,
} from '@/features/managers/public';
import type { MarketOpportunity, RecentTransfer, PriceChange } from '@/features/market/public';
import type { LeaderGap } from '@/features/standings/public';
import type {
  LastRoundMVP,
  LastRoundStats,
  CalendarStatus,
  CalendarMatch,
} from '@/features/rounds/public';
import type { RoundDetails } from '@/features/matches/public';
import type { PlayerBirthdayViewModel, PlayerRecentFormViewModel } from '@/features/players/public';

export interface PersonalDashboard {
  error?: 'User ID required';
  seasonStats?: ManagerSeasonStatsViewModel;
  captainStats?: ManagerCaptainStats;
  homeAwayStats?: ManagerHomeAwayStats;
  alerts?: ManagerPersonalizedAlert[];
  squadDetails?: ManagerSquadViewModel;
  leaderGap?: LeaderGap | null;
}
/** Display compatibility fields, not a database record or alternate Player model. */
export interface DashboardDisplayPlayer {
  player_id?: number;
  id?: number;
  name?: string | null;
  player_name?: string | null;
  team?: string | null;
  form_label?: string;
  avg_recent_points?: number | null;
  streak?: number;
  avg_points?: number | null;
}
export interface LeagueDashboard {
  leagueAverage: number | null;
  roundMVPs: LastRoundMVP[];
  upcomingBirthdays: PlayerBirthdayViewModel[];
  hotStreaks: DashboardDisplayPlayer[];
  coldStreaks: DashboardDisplayPlayer[];
}
export interface DashboardCalendarRound {
  round_id: number | null;
  round_name: string | null;
  start_date: string | null;
  end_date: string | null;
  total_matches: number;
  finished_matches: number;
  matches: Array<{
    id: number;
    date: string | null;
    status: CalendarMatch['status'];
    round_id: number | null;
    round_name: string | null;
  }>;
  status_calc: CalendarStatus;
}
export interface NextRoundDashboard {
  nextRound: RoundDetails | null;
  currentRoundStatus: DashboardCalendarRound | null;
  topPlayersForm: PlayerRecentFormViewModel[];
  captainRecommendations: ManagerCaptainRecommendation[];
  marketOpportunities: MarketOpportunity[];
}
export interface DashboardRecord {
  type: 'highest_round' | 'highest_transfer' | 'biggest_gain';
  label: string;
  description: string;
  user_name?: string | null;
  player_name?: string | null;
  value: number | string | null;
}
export interface RecentActivityDashboard {
  recentTransfers: RecentTransfer[];
  priceChanges: PriceChange[];
  recentRecords: DashboardRecord[];
  personalizedAlerts: ManagerPersonalizedAlert[];
}
export interface DashboardIdealLineup {
  lineup: Array<LastRoundStats & { img: string }>;
  total_points: number;
  round_name: string | null;
}
