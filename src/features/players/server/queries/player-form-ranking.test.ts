import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

vi.mock('@/lib/db/client', () => {
  const queryFn = vi.fn();
  return {
    pool: { query: queryFn },
    db: { query: queryFn },
  };
});

vi.mock('@/lib/db/season-context', () => ({
  resolveReadSeasonId: vi.fn(),
}));

vi.mock('@/lib/db/queries/core/playerForm', () => ({
  getPlayerFormMap: vi.fn(),
}));

import { pool as pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { getPlayerFormMap } from '@/lib/db/queries/core/playerForm';
import { getTopPlayersByForm } from './player.query';

describe('getTopPlayersByForm ranking and null semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveReadSeasonId).mockResolvedValue('2025-26');
  });

  it('preserves null for unobserved form, keeps real 0 identifiable, and sorts null to the end', async () => {
    const formMap = new Map([
      [1, { player_id: 1, recent_scores: '18,20', avg_recent_points: 19, avg_form_score: 19 }],
      [2, { player_id: 2, recent_scores: '0,0', avg_recent_points: 0, avg_form_score: 0 }],
      [3, { player_id: 3, recent_scores: '?,?,?', avg_recent_points: null, avg_form_score: null }],
      [4, { player_id: 4, recent_scores: '10,12', avg_recent_points: 11, avg_form_score: 11 }],
    ]);

    vi.mocked(getPlayerFormMap).mockResolvedValue(formMap);

    const mockRows = [
      { id: 1, name: 'Player Top', total_points: '100', games_played: '5' },
      { id: 2, name: 'Player Zero', total_points: '0', games_played: '2' },
      { id: 3, name: 'Player Unknown', total_points: '0', games_played: '0' },
      { id: 4, name: 'Player Mid', total_points: '50', games_played: '4' },
    ];

    vi.mocked(pgClient.query).mockResolvedValue({ rows: mockRows } as any);

    const result = await getTopPlayersByForm(4, 3);

    expect(result).toHaveLength(4);

    // 1st: Player Top with avg_points = 19
    expect(result[0].id).toBe(1);
    expect(result[0].avg_points).toBe(19);

    // 2nd: Player Mid with avg_points = 11
    expect(result[1].id).toBe(4);
    expect(result[1].avg_points).toBe(11);

    // 3rd: Player Zero with avg_points = 0 (identifiable real zero, ranked before null)
    expect(result[2].id).toBe(2);
    expect(result[2].avg_points).toBe(0);

    // 4th: Player Unknown with avg_points = null (unobserved form sorts cleanly to the end)
    expect(result[3].id).toBe(3);
    expect(result[3].avg_points).toBeNull();
  });

  it('never treats unknown form (?,?,?) as if the player genuinely scored zero', async () => {
    const formMap = new Map([
      [10, { player_id: 10, recent_scores: '0', avg_recent_points: 0, avg_form_score: 0 }],
      [20, { player_id: 20, recent_scores: '?', avg_recent_points: null, avg_form_score: null }],
    ]);

    vi.mocked(getPlayerFormMap).mockResolvedValue(formMap);

    const mockRows = [
      { id: 10, name: 'Zero Performer', total_points: '0', games_played: '1' },
      { id: 20, name: 'Unknown Performer', total_points: '0', games_played: '0' },
    ];

    vi.mocked(pgClient.query).mockResolvedValue({ rows: mockRows } as any);

    const result = await getTopPlayersByForm(2, 1);

    expect(result[0].id).toBe(10);
    expect(result[0].avg_points).toBe(0);

    expect(result[1].id).toBe(20);
    expect(result[1].avg_points).toBeNull();
    expect(result[1].avg_points).not.toBe(0);
  });
});
