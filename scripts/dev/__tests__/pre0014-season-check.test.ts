import { describe, expect, it, vi } from 'vitest';
import { checkPre0014Safety } from '../pre0014-season-check';
import {
  ALL_14_DROPPED_PLAYER_COLUMNS,
  ALL_4_DROPPED_TEAM_COLUMNS,
} from '../../season-model/backfill-2025-26';

describe('checkPre0014Safety', () => {
  it('returns safe = true when all 18 columns match exactly for season 2025-26', async () => {
    const mockClient: any = {
      query: vi.fn().mockImplementation((sql: string, params?: any[]) => {
        if (sql.includes('information_schema.columns') && sql.includes("'players'")) {
          return Promise.resolve({
            rows: ALL_14_DROPPED_PLAYER_COLUMNS.map((c) => ({ column_name: c })),
          });
        }
        if (sql.includes('information_schema.columns') && sql.includes("'teams'")) {
          return Promise.resolve({
            rows: ALL_4_DROPPED_TEAM_COLUMNS.map((c) => ({ column_name: c })),
          });
        }
        if (sql.includes('SELECT id FROM seasons WHERE id = $1')) {
          expect(params?.[0]).toBe('2025-26');
          return Promise.resolve({ rows: [{ id: '2025-26' }] });
        }
        if (sql.includes('LEFT JOIN player_seasons ps')) {
          return Promise.resolve({ rows: [{ count: 0 }] });
        }
        if (sql.includes('LEFT JOIN team_seasons ts')) {
          return Promise.resolve({ rows: [{ count: 0 }] });
        }
        if (sql.includes('FROM players p') && sql.includes('JOIN player_seasons ps')) {
          return Promise.resolve({ rows: [{ count: 0 }] });
        }
        if (sql.includes('FROM teams t') && sql.includes('JOIN team_seasons ts')) {
          return Promise.resolve({ rows: [{ count: 0 }] });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const result = await checkPre0014Safety(mockClient, '2025-26');
    expect(result.safe).toBe(true);
    expect(result.alreadyMigrated).toBe(false);
    expect(result.dataMismatches).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects migration if player_seasons.dorsal or price mismatches', async () => {
    const mockClient: any = {
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('information_schema.columns')) {
          return Promise.resolve({ rows: [{ column_name: 'dummy' }] });
        }
        if (sql.includes('SELECT id FROM seasons')) {
          return Promise.resolve({ rows: [{ id: '2025-26' }] });
        }
        if (sql.includes('LEFT JOIN player_seasons') || sql.includes('LEFT JOIN team_seasons')) {
          return Promise.resolve({ rows: [{ count: 0 }] });
        }
        if (sql.includes('FROM players p') && sql.includes('JOIN player_seasons ps')) {
          // Simulate 1 player record with mismatch on dorsal/price
          return Promise.resolve({ rows: [{ count: 1 }] });
        }
        if (sql.includes('FROM teams t') && sql.includes('JOIN team_seasons ts')) {
          return Promise.resolve({ rows: [{ count: 0 }] });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const result = await checkPre0014Safety(mockClient, '2025-26');
    expect(result.safe).toBe(false);
    expect(result.playerMismatches).toBe(1);
    expect(result.dataMismatches).toBe(1);
    expect(result.errors[0]).toContain(
      'player records with value mismatches across the 14 migrated columns'
    );
  });

  it('rejects migration if team_seasons.latitude mismatches', async () => {
    const mockClient: any = {
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('information_schema.columns')) {
          return Promise.resolve({ rows: [{ column_name: 'dummy' }] });
        }
        if (sql.includes('SELECT id FROM seasons')) {
          return Promise.resolve({ rows: [{ id: '2025-26' }] });
        }
        if (sql.includes('LEFT JOIN player_seasons') || sql.includes('LEFT JOIN team_seasons')) {
          return Promise.resolve({ rows: [{ count: 0 }] });
        }
        if (sql.includes('FROM players p') && sql.includes('JOIN player_seasons ps')) {
          return Promise.resolve({ rows: [{ count: 0 }] });
        }
        if (sql.includes('FROM teams t') && sql.includes('JOIN team_seasons ts')) {
          // Simulate 1 team record with mismatch on latitude
          return Promise.resolve({ rows: [{ count: 1 }] });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const result = await checkPre0014Safety(mockClient, '2025-26');
    expect(result.safe).toBe(false);
    expect(result.teamMismatches).toBe(1);
    expect(result.dataMismatches).toBe(1);
    expect(result.errors[0]).toContain(
      'team records with value mismatches across the 4 migrated columns'
    );
  });

  it('detects post-0014 state where dropped columns no longer exist', async () => {
    const mockClient: any = {
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('information_schema.columns')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const result = await checkPre0014Safety(mockClient, '2025-26');
    expect(result.safe).toBe(true);
    expect(result.alreadyMigrated).toBe(true);
  });

  it('rejects migration if target season does not exist', async () => {
    const mockClient: any = {
      query: vi.fn().mockImplementation((sql: string) => {
        if (sql.includes('information_schema.columns')) {
          return Promise.resolve({ rows: [{ column_name: 'dummy' }] });
        }
        if (sql.includes('SELECT id FROM seasons')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      }),
    };

    const result = await checkPre0014Safety(mockClient, '2025-26');
    expect(result.safe).toBe(false);
    expect(result.errors[0]).toContain('Target season "2025-26" does not exist');
  });
});
