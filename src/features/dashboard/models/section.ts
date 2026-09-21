import type { PersonalDashboard, NextRoundDashboard, LeagueDashboard } from './dashboard';

/** Framework-validated section selection with its existing, bounded read model. */
export type DashboardSectionContent =
  | { kind: 'season'; dashboard: PersonalDashboard }
  | { kind: 'comparison'; dashboard: PersonalDashboard }
  | { kind: 'next-round'; round: NextRoundDashboard }
  | { kind: 'market'; round: NextRoundDashboard }
  | { kind: 'league'; league: LeagueDashboard };
