import type {
  ComparisonManager,
  ManagerCaptainStats,
  ManagerHomeAwayStats,
} from '@/features/managers/public';
import type { UserPerformanceHistory } from '@/features/rounds/public';
import type {
  FullStandingsEntry,
  StreakStat,
  HeatCheckStat,
  HunterStat,
  BottlerStat,
  HeartbreakerStat,
  NoGloryStat,
  JinxStat,
  FloorCeilingStat,
  VolatilityStat,
  EfficiencyStat,
  DominanceStat,
  ReliabilityStat,
  TheoreticalGapStat,
  RivalryMatrixStat,
  LeagueComparisonStat,
} from '@/features/standings/public';
import type { PorrasStats } from '@/features/predictions/public';
import type {
  ManagerMarketStats,
  BestSeller,
  BiddingDuelsStats,
  TheThief,
} from '@/features/market/public';

export interface CompareHistory {
  userId: ComparisonManager['id'];
  history: UserPerformanceHistory[];
  captain: ManagerCaptainStats;
  homeAway: ManagerHomeAwayStats;
  squadStats: { avgPlayerPoints: number; bestPlayer: { name: string | null; points: number } };
}
export interface ComparePredictions {
  achievements: Partial<PorrasStats['achievements']>;
  clutch: PorrasStats['clutch_stats'];
  victorias: PorrasStats['porra_stats']['victorias'];
  promedios: PorrasStats['porra_stats']['promedios'];
  participation: PorrasStats['participation'];
}
export interface CompareAdvancedStats {
  streaks: StreakStat[];
  heatCheck: HeatCheckStat[];
  hunter: HunterStat[];
  bottler: BottlerStat[];
  heartbreaker: HeartbreakerStat[];
  noGlory: NoGloryStat[];
  jinx: JinxStat[];
  floorCeiling: FloorCeilingStat[];
  volatility: VolatilityStat[];
  efficiency: EfficiencyStat[];
  dominance: DominanceStat[];
  reliability: ReliabilityStat[];
  theoreticalGap: TheoreticalGapStat[];
  rivalryMatrix: RivalryMatrixStat['matrix'];
  leagueComparison: LeagueComparisonStat[];
  market: ManagerMarketStats[];
  bestSeller: BestSeller[];
  biddingDuels: BiddingDuelsStats | { matrix: BiddingDuelsStats['matrix']; summaries: never[] };
  theThief: TheThief[];
}
export interface CompareDataLiteResponse {
  users: ComparisonManager[];
  history: CompareHistory[];
  standings: FullStandingsEntry[];
  porras: PorrasStats['porra_stats']['promedios'];
  predictions: ComparePredictions;
}
export interface CompareDataResponse extends CompareDataLiteResponse {
  advancedStats: CompareAdvancedStats;
}
export interface CompareOpponentModel {
  current: ComparisonManager;
  opponent: ComparisonManager;
  currentStanding?: FullStandingsEntry;
  opponentStanding?: FullStandingsEntry;
  recentHistory: UserPerformanceHistory[];
}
export interface HeadToHeadProps {
  currentUser?: ComparisonManager;
  allUsersHistory?: CompareHistory[];
  usersList?: ComparisonManager[];
  standings?: FullStandingsEntry[];
  predictions?: Partial<ComparePredictions>;
  advancedStats?: Partial<CompareAdvancedStats>;
}
