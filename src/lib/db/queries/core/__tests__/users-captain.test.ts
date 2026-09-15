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

vi.mock('../playerForm', () => ({
  getPlayerFormMap: vi.fn(),
}));

vi.mock('../manager-directory', () => ({
  readManagerDirectory: vi.fn(),
}));

import { pool as pgClient } from '@/lib/db/client';
import { resolveReadSeasonId } from '@/lib/db/season-context';
import { getPlayerFormMap } from '../playerForm';
import { getCaptainRecommendations } from '../users';

describe('getCaptainRecommendations null form semantics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resolveReadSeasonId).mockResolvedValue('2025-26');
  });

  it('filters out unknown form (null) and real 0, only recommending positive form', async () => {
    const formMap = new Map([
      [1, { player_id: 1, recent_scores: '20,22', avg_recent_points: 21, avg_form_score: 21 }],
      [2, { player_id: 2, recent_scores: '0,0', avg_recent_points: 0, avg_form_score: 0 }],
      [3, { player_id: 3, recent_scores: '?,?,?', avg_recent_points: null, avg_form_score: null }],
    ]);

    vi.mocked(getPlayerFormMap).mockResolvedValue(formMap);

    const squadRows = [
      { player_id: 1, name: 'Star Player', position: 'Base', team_id: 10, team: 'Team A' },
      { player_id: 2, name: 'Zero Player', position: 'Alero', team_id: 10, team: 'Team A' },
      { player_id: 3, name: 'Unknown Player', position: 'Pivot', team_id: 10, team: 'Team A' },
    ];

    vi.mocked(pgClient.query).mockResolvedValue({ rows: squadRows } as any);

    const recommendations = await getCaptainRecommendations(1, 5);

    expect(recommendations).toHaveLength(1);
    expect(recommendations[0].player_id).toBe(1);
    expect(recommendations[0].avg_recent_points).toBe(21);
    expect(recommendations[0].recent_games).toBe(2);
    expect(recommendations[0].form_label).toBe('Buena forma');
  });

  it('correctly counts only played games, excluding both DNP ("X") and unknown ("?")', async () => {
    const formMap = new Map([
      [
        1,
        { player_id: 1, recent_scores: '15,?,X,20,?', avg_recent_points: 17.5, avg_form_score: 7 },
      ],
    ]);

    vi.mocked(getPlayerFormMap).mockResolvedValue(formMap);

    const squadRows = [
      { player_id: 1, name: 'Mixed Player', position: 'Base', team_id: 10, team: 'Team A' },
    ];

    vi.mocked(pgClient.query).mockResolvedValue({ rows: squadRows } as any);

    const recommendations = await getCaptainRecommendations(1, 5);

    expect(recommendations).toHaveLength(1);
    // 15 and 20 are played games; ?, X, ? are not played
    expect(recommendations[0].recent_games).toBe(2);
  });
});
