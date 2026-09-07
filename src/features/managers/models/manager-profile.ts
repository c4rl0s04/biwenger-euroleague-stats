import type {
  ManagerSeasonStatsViewModel,
  ManagerSquadViewModel,
  ManagerRoundsViewModel,
} from './manager-reads';
import type { ManagerContributorViewModel } from './manager-contributors';
import type { ManagerTournamentParticipation } from '@/features/tournaments/public';

export type ManagerProfilePresentation = 'desktop' | 'phone';
export interface ManagerProfileOverview {
  stats: ManagerSeasonStatsViewModel;
  squad: ManagerSquadViewModel;
}
export interface ManagerProfileDesktop extends ManagerProfileOverview {
  recentRounds: ManagerRoundsViewModel;
  tournaments: ManagerTournamentParticipation[];
  topContributors: ManagerContributorViewModel[];
}
export type ManagerProfileResult =
  | { kind: 'missing'; presentation: ManagerProfilePresentation }
  | { kind: 'phone'; data: ManagerProfileOverview }
  | { kind: 'desktop'; data: ManagerProfileDesktop };

export interface ManagerProfileDisplayRow {
  key: string;
  index: number;
  title: string;
  subtitle?: string;
  value?: string;
  href?: string;
}
export interface ManagerProfileSection {
  context: string;
  rows: ManagerProfileDisplayRow[];
}
