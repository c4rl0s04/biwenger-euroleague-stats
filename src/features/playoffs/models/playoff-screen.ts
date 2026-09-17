import type { TeamName } from '@/features/teams/public';
import type { PlayoffLeaderboardRow } from './playoffs';

export type PlayoffOverviewModel =
  | { presentation: 'phone'; leaderboard: PlayoffLeaderboardRow[] }
  | { presentation: 'desktop'; leaderboard: PlayoffLeaderboardRow[]; teams: TeamName[] };

export interface PlayoffDetailModel {
  user: PlayoffLeaderboardRow;
  rows: { key: string; title: string; value?: string }[];
}
