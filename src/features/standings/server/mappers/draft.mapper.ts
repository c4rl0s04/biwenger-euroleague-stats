import 'server-only';
import {
  DraftPerformanceViewModel,
  DraftPlayerViewModel,
  DraftRetainedPointsViewModel,
  DraftPlayerBreakdownViewModel,
  DraftRegretViewModel,
  DraftLoyaltyViewModel,
  DraftPotentialViewModel,
  DraftDetailedViewModel,
} from '../../models/draft';

export function mapDraftPerformance(row: any): DraftPerformanceViewModel {
  return {
    user_id: String(row.user_id),
    user_name: String(row.user_name || ''),
    user_color_index: Number(row.user_color_index || 0),
    icon: row.icon ? String(row.icon) : null,
    total_points: Number(row.total_points || row.actual_points || 0),
  };
}
export function mapDraftPlayer(row: any): DraftPlayerViewModel {
  return {
    user_id: String(row.user_id),
    user_name: String(row.user_name || ''),
    user_color_index: Number(row.user_color_index || 0),
    icon: row.icon ? String(row.icon) : null,
    player_name: String(row.player_name || ''),
    player_id: Number(row.player_id || 0),
    total_fantasy_points: Number(row.total_fantasy_points || 0),
  };
}
export function mapDraftRetainedPoints(row: any): DraftRetainedPointsViewModel {
  return {
    user_id: String(row.user_id),
    user_name: String(row.user_name || ''),
    user_color_index: Number(row.user_color_index || 0),
    icon: row.icon ? String(row.icon) : null,
    players_contributed: Number(row.players_contributed || 0),
    total_points: Number(row.total_points || 0),
  };
}
export function mapDraftPlayerBreakdown(row: any): DraftPlayerBreakdownViewModel {
  return {
    user_id: String(row.user_id),
    user_name: String(row.user_name || ''),
    icon: row.icon ? String(row.icon) : null,
    player_name: String(row.player_name || ''),
    points: Number(row.points || 0),
  };
}
export function mapDraftRegret(row: any): DraftRegretViewModel {
  return {
    user_id: String(row.user_id),
    user_name: String(row.user_name || ''),
    user_color_index: Number(row.user_color_index || 0),
    icon: row.icon ? String(row.icon) : null,
    points_lost: Number(row.points_lost || 0),
    top_regret_player: String(row.top_regret_player || ''),
  };
}
export function mapDraftLoyalty(row: any): DraftLoyaltyViewModel {
  return {
    user_id: String(row.user_id),
    user_name: String(row.user_name || ''),
    user_color_index: Number(row.user_color_index || 0),
    icon: row.icon ? String(row.icon) : null,
    retained_count: Number(row.retained_count || 0),
    initial_count: Number(row.initial_count || 0),
    loyalty_percentage: Number(row.loyalty_percentage || 0),
  };
}
export function mapDraftPotential(row: any): DraftPotentialViewModel {
  return {
    user_id: String(row.user_id),
    user_name: String(row.user_name || ''),
    user_color_index: Number(row.user_color_index || 0),
    icon: row.icon ? String(row.icon) : null,
    total_points: Number(row.total_points || 0),
    total_value: Number(row.total_value || 0),
  };
}
export function mapDraftDetailed(row: any): DraftDetailedViewModel {
  return {
    user_id: String(row.user_id || row.manager_id),
    manager_name: String(row.manager_name || row.user_name || ''),
    manager_color_index: Number(row.manager_color_index || row.user_color_index || 0),
    player_id: Number(row.player_id || 0),
    player_name: String(row.player_name || ''),
    player_position: String(row.player_position || ''),
    current_points: Number(row.current_points || 0),
    current_price: Number(row.current_price || 0),
    current_owner_id: row.current_owner_id ? String(row.current_owner_id) : null,
    current_owner: row.current_owner ? String(row.current_owner) : null,
  };
}
