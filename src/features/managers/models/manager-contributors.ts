/** Historical player contribution, not the manager's current squad. */
export interface ManagerContributorViewModel {
  player_id: number;
  player_name: string | null;
  player_img: string | null;
  total_base_points: number;
  total_contribution: number;
  games_played: number;
}
