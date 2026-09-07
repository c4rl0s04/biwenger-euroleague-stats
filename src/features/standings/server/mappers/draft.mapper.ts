import 'server-only';
import type { InitialSquadPerformance } from '../queries/draft.query';
import type {
  BestInitialSquadPlayer,
  InitialSquadRetainedPoints,
  InitialSquadPlayerBreakdown,
  InitialSquadRegret,
  InitialSquadLoyalty,
  InitialSquadPotentialAdvanced,
  InitialSquadDetailed,
} from '../queries/draft.query';
import type {
  DraftPerformanceViewModel,
  DraftPlayerViewModel,
  DraftRetainedPointsViewModel,
  DraftPlayerBreakdownViewModel,
  DraftRegretViewModel,
  DraftLoyaltyViewModel,
  DraftPotentialViewModel,
  DraftDetailedViewModel,
} from '../../models/draft';

export function mapDraftPerformance(row: InitialSquadPerformance): DraftPerformanceViewModel {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    icon: row.icon,
    actual_points: row.actual_points,
    potential_points: row.potential_points,
    roi_percentage: row.roi_percentage,
  };
}

export function mapDraftPlayer(row: BestInitialSquadPlayer): DraftPlayerViewModel {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    icon: row.icon,
    player_name: row.player_name,
    player_id: row.player_id,
    total_fantasy_points: row.total_fantasy_points,
  };
}

export function mapDraftRetainedPoints(
  row: InitialSquadRetainedPoints
): DraftRetainedPointsViewModel {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    icon: row.icon,
    players_contributed: row.players_contributed,
    total_points: row.total_points,
  };
}

export function mapDraftPlayerBreakdown(
  row: InitialSquadPlayerBreakdown
): DraftPlayerBreakdownViewModel {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    icon: row.icon,
    player_name: row.player_name,
    points: row.points,
  };
}

export function mapDraftRegret(row: InitialSquadRegret): DraftRegretViewModel {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    icon: row.icon,
    points_lost: row.points_lost,
    top_regret_player: row.top_regret_player,
  };
}

export function mapDraftLoyalty(row: InitialSquadLoyalty): DraftLoyaltyViewModel {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    icon: row.icon,
    retained_count: row.retained_count,
    initial_count: row.initial_count,
    loyalty_percentage: row.loyalty_percentage,
  };
}

export function mapDraftPotential(row: InitialSquadPotentialAdvanced): DraftPotentialViewModel {
  return {
    user_id: row.user_id,
    user_name: row.user_name,
    user_color_index: row.user_color_index,
    icon: row.icon,
    total_points: row.total_points,
    total_value: row.total_value,
  };
}

export function mapDraftDetailed(row: InitialSquadDetailed): DraftDetailedViewModel {
  return {
    user_id: row.user_id,
    manager_name: row.manager_name,
    manager_color_index: row.manager_color_index,
    player_id: row.player_id,
    player_name: row.player_name,
    player_position: row.player_position,
    current_points: row.current_points,
    current_price: row.current_price,
    current_owner_id: row.current_owner_id,
    current_owner: row.current_owner,
    current_owner_color_index: row.current_owner_color_index,
    points_contributed: row.points_contributed,
  };
}
