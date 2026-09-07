import type { ManagerContributorViewModel } from '../../models/manager-contributors';
import type { ManagerContributorRecord } from '../queries/manager-contributors.records';

export function mapManagerContributor(row: ManagerContributorRecord): ManagerContributorViewModel {
  return {
    player_id: row.player_id,
    player_name: row.player_name,
    player_img: row.player_img,
    total_base_points: parseInt(String(row.total_base_points)) || 0,
    total_contribution: parseInt(String(row.total_contribution)) || 0,
    games_played: parseInt(String(row.games_played)) || 0,
  };
}
