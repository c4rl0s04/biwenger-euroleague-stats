import { expect, it, vi, describe } from 'vitest';

vi.mock('server-only', () => ({}));

import {
  mapDraftPlayer,
  mapDraftRetainedPoints,
  mapDraftPlayerBreakdown,
  mapDraftRegret,
  mapDraftLoyalty,
  mapDraftPotential,
  mapDraftDetailed,
} from '../mappers/draft.mapper';

describe('Draft bundle mappers', () => {
  describe('mapDraftPlayer (bestDraftPerUser)', () => {
    it('preserves all seven fields exactly', () => {
      const row = {
        user_id: '007',
        user_name: 'Alice',
        user_color_index: 3,
        icon: 'hat.png',
        player_name: 'LeBron',
        player_id: 42,
        total_fantasy_points: 150.5,
      };
      expect(mapDraftPlayer(row)).toEqual(row);
    });

    it('preserves null name and icon', () => {
      const row = {
        user_id: 'manager-x',
        user_name: null,
        user_color_index: 0,
        icon: null,
        player_name: 'Curry',
        player_id: 1,
        total_fantasy_points: 0,
      };
      expect(mapDraftPlayer(row)).toEqual(row);
    });

    it('excludes extra fields', () => {
      const row = {
        user_id: '1',
        user_name: 'X',
        user_color_index: 0,
        icon: null,
        player_name: 'P',
        player_id: 1,
        total_fantasy_points: 10,
        secret_field: 'hidden',
      };
      const result = mapDraftPlayer(row);
      expect(result).not.toHaveProperty('secret_field');
      expect(Object.keys(result)).toHaveLength(7);
    });
  });

  describe('mapDraftRetainedPoints', () => {
    it('preserves all six fields', () => {
      const row = {
        user_id: '007',
        user_name: null,
        user_color_index: 2,
        icon: '',
        players_contributed: 5,
        total_points: -10.5,
      };
      expect(mapDraftRetainedPoints(row)).toEqual(row);
    });
  });

  describe('mapDraftPlayerBreakdown', () => {
    it('preserves all five fields', () => {
      const row = {
        user_id: '1',
        user_name: null,
        icon: null,
        player_name: 'Jokic',
        points: 0,
      };
      expect(mapDraftPlayerBreakdown(row)).toEqual(row);
    });
  });

  describe('mapDraftRegret', () => {
    it('preserves all six fields including nullable top_regret_player', () => {
      const row = {
        user_id: '1',
        user_name: 'Bob',
        user_color_index: 1,
        icon: null,
        points_lost: 45.2,
        top_regret_player: null,
      };
      expect(mapDraftRegret(row)).toEqual(row);
    });
  });

  describe('mapDraftLoyalty', () => {
    it('preserves all seven fields', () => {
      const row = {
        user_id: '1',
        user_name: null,
        user_color_index: null,
        icon: '',
        retained_count: 3,
        initial_count: 5,
        loyalty_percentage: 60.0,
      };
      expect(mapDraftLoyalty(row)).toEqual(row);
    });
  });

  describe('mapDraftPotential', () => {
    it('preserves all six fields', () => {
      const row = {
        user_id: 'manager-x',
        user_name: 'Mgr',
        user_color_index: 4,
        icon: null,
        total_points: -5,
        total_value: 0,
      };
      expect(mapDraftPotential(row)).toEqual(row);
    });
  });

  describe('mapDraftDetailed', () => {
    it('preserves all twelve fields including restored current_owner_color_index and points_contributed', () => {
      const row = {
        user_id: '0042',
        manager_name: 'Team A',
        manager_color_index: 2,
        player_id: 100,
        player_name: 'Doncic',
        player_position: 'G',
        current_points: 500,
        current_price: 12000,
        current_owner_id: '007',
        current_owner: 'Owner X',
        current_owner_color_index: 3,
        points_contributed: 250.5,
      };
      const result = mapDraftDetailed(row);
      expect(result).toEqual({
        ...row,
        user_id: '0042',
        current_owner_id: '007',
      });
    });

    it('preserves null owner fields and nullable position', () => {
      const row = {
        user_id: '007',
        manager_name: null,
        manager_color_index: 0,
        player_id: 1,
        player_name: 'Player',
        player_position: null,
        current_points: 0,
        current_price: 0,
        current_owner_id: null,
        current_owner: null,
        current_owner_color_index: null,
        points_contributed: 0,
      };
      expect(mapDraftDetailed(row)).toEqual({
        ...row,
        user_id: '007',
      });
    });

    it('excludes extra fields', () => {
      const row = {
        user_id: '1',
        manager_name: 'M',
        manager_color_index: 0,
        player_id: 1,
        player_name: 'P',
        player_position: 'C',
        current_points: 10,
        current_price: 100,
        current_owner_id: null,
        current_owner: null,
        current_owner_color_index: null,
        points_contributed: 5,
        synthetic_secret: 'no',
      };
      const result = mapDraftDetailed(row);
      expect(result).not.toHaveProperty('synthetic_secret');
      expect(Object.keys(result)).toHaveLength(12);
    });
  });
});
