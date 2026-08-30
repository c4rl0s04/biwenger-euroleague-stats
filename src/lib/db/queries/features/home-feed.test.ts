import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, resolveReadSeasonId } = vi.hoisted(() => ({
  query: vi.fn(),
  resolveReadSeasonId: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/client', () => ({ db: { query } }));
vi.mock('@/lib/db/season-context', () => ({ resolveReadSeasonId }));

import { queryHomeActivityRows, queryHomeRoundHighlightPlayers } from './home-feed';

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
    expect(sql).toMatch(
      /EXISTS\s*\(\s*SELECT 1\s*FROM conceptual_totals existing_totals\s*WHERE existing_totals\.jornada = crs\.base_round\s*\)/
    );
  });

  it('loads all visible highlight players in one ordered batch', async () => {
    await queryHomeRoundHighlightPlayers([8, 4, 8]);

    const [sql, params] = query.mock.calls.at(-1)!;
    expect(sql).toContain('prs.round_id = ANY($2::int[])');
    expect(sql).toContain('ORDER BY prs.round_id, prs.fantasy_points DESC NULLS LAST, p.id');
    expect(params).toEqual(['2025-26', [4, 8]]);
  });

  it('dates complete tournament fixtures from their linked real round', async () => {
    await queryHomeActivityRows({ filter: 'results', limit: 16 });

    const [sql] = query.mock.calls.at(-1)!;
    expect(sql).toContain('tournament_round_events AS');
    expect(sql).toContain('tf.home_score IS NOT NULL');
    expect(sql).toContain('tf.away_score IS NOT NULL');
    expect(sql).toContain('real_round_states');
    expect(sql).toContain('terminal_tournament_rounds AS');
    expect(sql).toMatch(
      /ORDER BY\s+tf\.season_id,\s+tf\.tournament_id,\s+COALESCE\(tp\.order_index, -1\) DESC,\s+tf\.round_id DESC/
    );
    expect(sql).toContain('terminal_round.round_id = tf.round_id AS is_final_round');
    expect(sql).not.toContain('to_timestamp(tf.date)');
  });
});
