import { describe, expect, it, vi } from 'vitest';
import { prepareOfficialMutations } from '../official';

const stat = {
  gameCode: 1,
  playerCode: 'P014102',
  playerName: 'Kai Jones',
  teamCode: 'MAD',
  isHome: true,
  isStarter: true,
  isPlaying: false,
  dorsal: '5',
  minutes: '10:00',
  minutesSeconds: 600,
  points: 2,
  twoPointsMade: 1,
  twoPointsAttempted: 1,
  threePointsMade: 0,
  threePointsAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
  offensiveRebounds: 1,
  defensiveRebounds: 1,
  totalRebounds: 2,
  assists: 0,
  steals: 0,
  turnovers: 0,
  blocks: 0,
  blocksAgainst: 0,
  foulsCommitted: 0,
  foulsReceived: 0,
  valuation: 4,
  plusMinus: 1,
  raw: {},
};

function database() {
  const client = {
    query: vi.fn(async (_sql: string, _params?: any[]) => ({ rows: [], rowCount: 1 })),
    release: vi.fn(),
  };
  const db = {
    query: vi.fn(async (_sql: string, _params?: any[]) => ({ rows: [], rowCount: 1 })),
    connect: vi.fn(async () => client),
  };
  return { db, client };
}

describe('official game reconciliation', () => {
  it('upserts partial live data without deleting possibly missing events', async () => {
    const { db, client } = database();
    const mutations = prepareOfficialMutations(db as any, '2026-27');
    await mutations.persistGameData({
      gameCode: 1,
      report: null,
      metadata: null,
      boxscore: [stat],
      playByPlay: [],
      shots: [],
      checksum: 'live',
      finalized: false,
    });
    const sql = client.query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).not.toContain('DELETE FROM official_');
    expect(sql).toContain('ON CONFLICT (season_id,game_code,provider_player_code)');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });

  it('replaces all granular datasets transactionally when a game finishes', async () => {
    const { db, client } = database();
    const mutations = prepareOfficialMutations(db as any, '2026-27');
    await mutations.persistGameData({
      gameCode: 1,
      report: null,
      metadata: null,
      boxscore: [stat],
      playByPlay: [],
      shots: [],
      checksum: 'final',
      finalized: true,
    });
    const sql = client.query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DELETE FROM official_player_game_stats');
    expect(sql).toContain('DELETE FROM official_play_by_play');
    expect(sql).toContain('DELETE FROM official_shots');
    expect(sql).toContain('finalized_at=COALESCE');
    expect(client.query.mock.calls[0][0]).toBe('BEGIN');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });

  it('materializes sporting fields without overwriting Biwenger fantasy points', async () => {
    const { db } = database();
    const mutations = prepareOfficialMutations(db as any, '2026-27');
    await mutations.materializeRoundStats(10);
    const sql = db.query.mock.calls[0][0];
    expect(sql).not.toContain('fantasy_points');
    expect(db.query.mock.calls[0][1]).toEqual(['2026-27', 10]);
  });
});
