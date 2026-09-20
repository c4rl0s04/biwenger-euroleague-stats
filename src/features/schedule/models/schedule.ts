import type { ManagerDirectoryViewModel } from '@/features/managers/public';
import type { MatchListItemViewModel, MatchViewModel } from '@/features/matches/public';

/** Explicit UI contract. Legacy field names keep the frozen lineup command compatible. */
export interface SchedulePlayer {
  id: number;
  name: string | null;
  team_id: number | null;
  team_name: string | null;
  team_code: string | null;
  position: string | null;
  price: number | null;
  img: string | null;
  puntos: number | null;
}
export interface ScheduleMatchPlayer extends SchedulePlayer {
  is_home: boolean;
  opponent: string | null;
  team_color: string;
}
export interface ScheduleMatch {
  match_id: number;
  date: string | null;
  home_id: number | null;
  away_id: number | null;
  home_team: string | null;
  away_team: string | null;
  home_code: string | null;
  away_code: string | null;
  home_team_color: string;
  away_team_color: string;
  user_players: ScheduleMatchPlayer[];
  has_players: boolean;
  listItem: MatchListItemViewModel;
}
export interface ScheduleRound {
  round_id: number | null;
  round_name: string | null;
  min_date?: string | null;
}
export type UserSchedule =
  | { found: false; message?: string; matches?: never; round?: never; userPlayers?: never }
  | {
      found: true;
      round: ScheduleRound;
      matches: ScheduleMatch[];
      message?: string;
      total_players?: number;
      userPlayers?: SchedulePlayer[];
    };
export interface ScheduleScreenModel {
  userId: string | undefined;
  users: ManagerDirectoryViewModel[];
  rounds: ScheduleRound[];
  schedule: UserSchedule;
}
export interface ScheduleMapModel {
  matches: MatchViewModel[];
  backHref: string;
}
