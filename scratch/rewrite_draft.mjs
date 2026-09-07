import fs from 'fs';

const draftModels = `
export interface DraftPerformanceViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  total_points: number;
}
export interface DraftPlayerViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  player_name: string;
  player_id: number;
  total_fantasy_points: number;
}
export interface DraftRetainedPointsViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  players_contributed: number;
  total_points: number;
}
export interface DraftPlayerBreakdownViewModel {
  user_id: string;
  user_name: string;
  icon: string | null;
  player_name: string;
  points: number;
}
export interface DraftRegretViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  points_lost: number;
  top_regret_player: string;
}
export interface DraftLoyaltyViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  retained_count: number;
  initial_count: number;
  loyalty_percentage: number;
}
export interface DraftPotentialViewModel {
  user_id: string;
  user_name: string;
  user_color_index: number;
  icon: string | null;
  total_points: number;
  total_value: number;
}
export interface DraftDetailedViewModel {
  user_id: string | number;
  manager_name: string;
  manager_color_index: number;
  player_id: number;
  player_name: string;
  player_position: string;
  current_points: number;
  current_price: number;
  current_owner_id: string | number | null;
  current_owner: string | null;
}
export interface DraftAnalyticsViewModel {
  performance: DraftPerformanceViewModel[];
}
export interface DraftStatsBundleViewModel {
  bestDraftPerUser: DraftPlayerViewModel[];
  retainedRanking: DraftRetainedPointsViewModel[];
  retainedBreakdown: DraftPlayerBreakdownViewModel[];
  regretRanking: DraftRegretViewModel[];
  loyaltyRanking: DraftLoyaltyViewModel[];
  potentialRanking: DraftPotentialViewModel[];
  detailedSquads: DraftDetailedViewModel[];
}
`;
fs.writeFileSync('src/features/standings/models/draft.ts', draftModels);

const draftMapper = `import 'server-only';
import {
  DraftPerformanceViewModel,
  DraftPlayerViewModel,
  DraftRetainedPointsViewModel,
  DraftPlayerBreakdownViewModel,
  DraftRegretViewModel,
  DraftLoyaltyViewModel,
  DraftPotentialViewModel,
  DraftDetailedViewModel,
} from '../models/draft';

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
`;
fs.writeFileSync('src/features/standings/server/mappers/draft.mapper.ts', draftMapper);

const draftService = `import 'server-only';
import { cache } from 'react';
import {
  mapDraftPerformance,
  mapDraftPlayer,
  mapDraftRetainedPoints,
  mapDraftPlayerBreakdown,
  mapDraftRegret,
  mapDraftLoyalty,
  mapDraftPotential,
  mapDraftDetailed,
} from '../mappers/draft.mapper';
import {
  getInitialSquadActualPerformance,
  getBestInitialSquadPlayer,
  getInitialSquadRetainedPoints,
  getInitialSquadRetainedBreakdown,
  getInitialSquadRegret,
  getInitialSquadLoyalty,
  getInitialSquadPotentialAdvanced,
  getInitialSquadsDetailed,
} from '../queries/draft.query';

/**
 * Access: Public league statistics.
 * Freshness: Cached HTTP max-age=900, stale-while-revalidate=60
 */
export const fetchInitialSquadAnalytics = cache(async () => {
  const data = await getInitialSquadActualPerformance();
  return {
    performance: data.map(mapDraftPerformance)
  };
});

/**
 * Access: Public league statistics.
 * Freshness: Cached HTTP max-age=300, stale-while-revalidate=60
 */
export const fetchInitialSquadStats = cache(async () => {
  const [
    bestDraftPerUser,
    retainedRanking,
    retainedBreakdown,
    regretRanking,
    loyaltyRanking,
    potentialRanking,
    detailedSquads,
  ] = await Promise.all([
    getBestInitialSquadPlayer(),
    getInitialSquadRetainedPoints(),
    getInitialSquadRetainedBreakdown(),
    getInitialSquadRegret(),
    getInitialSquadLoyalty(),
    getInitialSquadPotentialAdvanced(),
    getInitialSquadsDetailed(),
  ]);

  return {
    bestDraftPerUser: bestDraftPerUser.map(mapDraftPlayer),
    retainedRanking: retainedRanking.map(mapDraftRetainedPoints),
    retainedBreakdown: retainedBreakdown.map(mapDraftPlayerBreakdown),
    regretRanking: regretRanking.map(mapDraftRegret),
    loyaltyRanking: loyaltyRanking.map(mapDraftLoyalty),
    potentialRanking: potentialRanking.map(mapDraftPotential),
    detailedSquads: detailedSquads.map(mapDraftDetailed),
  };
});
`;
fs.writeFileSync('src/features/standings/server/services/draft.service.ts', draftService);

