import type { SafeLineupResponse } from './lineup';
export interface LineupWorkspacePlayer {
  id: string | number;
  name: string;
  position: string | null;
  team: string | null;
  team_img: string | null;
  team_short_name: string | null;
  img: string | null;
  price: number | null;
  price_increment: number | null;
  points: number | null;
  average: number | null;
  recent_scores: string;
  detailsAvailable: boolean;
}
export interface LineupWorkspace {
  provider: SafeLineupResponse;
  players: LineupWorkspacePlayer[];
  baseline: string;
  checkedAt: string;
}
