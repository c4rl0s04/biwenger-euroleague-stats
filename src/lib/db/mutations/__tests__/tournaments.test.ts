import { describe, expect, it, vi } from 'vitest';
import { prepareTournamentMutations } from '../tournaments';

function createMockDb(rows: any[] = [{ id: 10 }]) {
  return {
    query: vi.fn(async () => ({ rows, rowCount: rows.length })),
  };
}

describe('tournament mutations season isolation', () => {
  it('writes tournaments with the configured season id', async () => {
    const db = createMockDb();
    const mutations = prepareTournamentMutations(db as any, { seasonId: '2026-27' });

    await mutations.upsertTournament({
      id: 10,
      league_id: 1,
      name: 'Cup',
      type: 'league',
      status: 'active',
      data_json: '{}',
      updated_at: 123,
    });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('season_id, id'), [
      '2026-27',
      10,
      1,
      'Cup',
      'league',
      'active',
      '{}',
      123,
    ]);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(season_id, id)'),
      expect.any(Array)
    );
  });

  it('allows reused external tournament ids because uniqueness is season-scoped', async () => {
    const db = createMockDb([]);
    const mutations = prepareTournamentMutations(db as any, { seasonId: '2026-27' });

    await expect(
      mutations.upsertTournament({
        id: 10,
        league_id: 1,
        name: 'Cup',
        type: 'league',
        status: 'active',
        data_json: '{}',
        updated_at: 123,
      })
    ).resolves.toBeUndefined();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(season_id, id)'),
      expect.arrayContaining(['2026-27', 10])
    );
  });

  it('uses season-scoped conflict keys for phases, fixtures, and standings', async () => {
    const db = createMockDb([{ id: 99 }]);
    const mutations = prepareTournamentMutations(db as any, { seasonId: '2026-27' });

    await mutations.upsertPhase({
      tournament_id: 10,
      name: 'League',
      type: 'league',
      order_index: 1,
    });
    await mutations.upsertFixture({
      id: 50,
      tournament_id: 10,
      phase_id: 99,
      round_name: 'Round 1',
      round_id: 1,
      group_name: null,
      home_user_id: '1',
      away_user_id: '2',
      home_score: 10,
      away_score: 8,
      date: 123,
      status: 'finished',
    });
    await mutations.upsertStanding({
      tournament_id: 10,
      phase_name: 'league',
      group_name: null,
      user_id: '1',
      position: 1,
      points: 3,
      won: 1,
      lost: 0,
      drawn: 0,
      scored: 10,
      against: 8,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(season_id, tournament_id, order_index)'),
      ['2026-27', 10, 'League', 'league', 1]
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT(season_id, tournament_id, id)'),
      expect.arrayContaining(['2026-27', 50, 10])
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'ON CONFLICT(season_id, tournament_id, phase_name, group_name, user_id)'
      ),
      expect.arrayContaining(['2026-27', 10, 'league', null, '1'])
    );
  });
});
