import { expect, it, vi, describe } from 'vitest';
import { GET, dynamic } from '@/app/api/standings/analytics/route';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId: async () => 1 }));

const mockQuery = vi.fn();
vi.mock('@/lib/db', () => ({
  pgClient: {
    query: (...args: any[]) => mockQuery(...args),
  },
  db: {},
}));

describe('GET /api/standings/analytics', () => {
  it('returns populated original-shaped records with all seven fields and exact JSON envelope', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          user_id: '123',
          user_name: 'Alice',
          user_color_index: 2,
          icon: 'icon.png',
          actual_points: 100,
          potential_points: 120,
          roi_percentage: 83.3,
          synthetic_secret: 'hide-me',
        },
      ],
    });

    const response = await GET();
    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toEqual({
      success: true,
      data: [
        {
          user_id: '123',
          user_name: 'Alice',
          user_color_index: 2,
          icon: 'icon.png',
          actual_points: 100,
          potential_points: 120,
          roi_percentage: 83.3,
        },
      ],
    });

    expect(data.data[0]).not.toHaveProperty('synthetic_secret');
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=900, stale-while-revalidate=60'
    );
  });

  it('returns empty array', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({ success: true, data: [] });
  });

  it('handles string IDs, nulls, zero, negative, decimal scores', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          user_id: '007',
          user_name: null,
          user_color_index: 0,
          icon: null,
          actual_points: -5.5,
          potential_points: 0,
          roi_percentage: -100.5,
        },
        {
          user_id: 'manager-x',
          user_name: 'Manager X',
          user_color_index: 5,
          icon: '',
          actual_points: 0,
          potential_points: 10,
          roi_percentage: 0,
        },
      ],
    });

    const response = await GET();
    const data = await response.json();
    expect(data.data).toEqual([
      {
        user_id: '007',
        user_name: null,
        user_color_index: 0,
        icon: null,
        actual_points: -5.5,
        potential_points: 0,
        roi_percentage: -100.5,
      },
      {
        user_id: 'manager-x',
        user_name: 'Manager X',
        user_color_index: 5,
        icon: '',
        actual_points: 0,
        potential_points: 10,
        roi_percentage: 0,
      },
    ]);
  });

  it('query rejection preserves route status, error text, and exact cache headers', async () => {
    mockQuery.mockRejectedValueOnce(new Error('db error'));
    const response = await GET();
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ success: false, error: 'Internal Server Error' });
    expect(response.headers.get('Cache-Control')).toBe(
      'private, no-store, max-age=0, must-revalidate'
    );
  });

  it('keeps dynamic declaration unchanged', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('fetchInitialSquadAnalytics does not use React cache wrapper', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const source = fs.readFileSync(
      path.resolve('src/features/standings/server/services/draft.service.ts'),
      'utf8'
    );
    expect(source).not.toMatch(/export const fetchInitialSquadAnalytics = cache\(/);
    expect(source).toMatch(/export const fetchInitialSquadAnalytics = async \(\) => \{/);
  });
});
