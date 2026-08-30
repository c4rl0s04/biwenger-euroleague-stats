import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, resolveReadSeasonId } = vi.hoisted(() => ({
  query: vi.fn(),
  resolveReadSeasonId: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/client', () => ({ db: { query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId }));

import { queryHomeActivityRows } from './home-feed';

describe('home activity feed query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveReadSeasonId.mockResolvedValue('2025-26');
    query.mockResolvedValue({ rows: [] });
  });

  it('selects the latest historical market value available on the local transfer date', async () => {
    await queryHomeActivityRows({ filter: 'transfers', limit: 16 });

    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain('LEFT JOIN LATERAL');
    expect(sql).toContain('mv.season_id = f.season_id');
    expect(sql).toContain('mv.player_id = f.player_id');
    expect(sql).toMatch(/mv\.date\s*<=\s*\([\s\S]*AT TIME ZONE 'Europe\/Madrid'[\s\S]*\)::date/);
    expect(sql).toContain('ORDER BY mv.date DESC, mv.id DESC');
    expect(sql).toContain("'marketValue', market_value");
    expect(sql).toContain("'marketValueAt', CASE");
    expect(params).toEqual(['2025-26', null, null, ['transfer_day'], 16]);
  });

  it('maps combined filters to every event family represented by the chip', async () => {
    await queryHomeActivityRows({ filter: 'rounds', limit: 16 });
    const [, roundsParams] = query.mock.calls.at(-1)!;

    await queryHomeActivityRows({ filter: 'predictions', limit: 16 });
    const [, predictionsParams] = query.mock.calls.at(-1)!;

    await queryHomeActivityRows({ filter: 'results', limit: 16 });
    const [, resultsParams] = query.mock.calls.at(-1)!;

    expect(roundsParams[3]).toEqual(['round_completed', 'admin_bonus', 'round_highlight']);
    expect(predictionsParams[3]).toEqual(['prediction_round']);
    expect(resultsParams[3]).toEqual(['match_session', 'tournament_round']);
  });

  it('publishes predictions only after every conceptual-round match has finished', async () => {
    await queryHomeActivityRows({ filter: 'predictions', limit: 16 });

    const [sql] = query.mock.calls.at(-1)!;
    expect(sql).toContain('prediction_round_events AS');
    expect(sql).toContain("BOOL_AND(status = 'finished'");
    expect(sql).toContain("'participation'");
    expect(sql).toContain("'actualResults'");
    expect(sql).toContain('complete_prediction_rankings');
  });
});
