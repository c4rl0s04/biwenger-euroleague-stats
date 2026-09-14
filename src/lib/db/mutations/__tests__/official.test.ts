import { describe, expect, it, vi } from 'vitest';
import { prepareOfficialGameMutations } from '../official/game-data';

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
    query: vi.fn(async (sql: string, _params?: any[]) => {
      if (sql.includes('SELECT round_id FROM matches')) {
        return { rows: [{ round_id: 10 }], rowCount: 1 };
      }
      if (sql.includes('SELECT provider_player_code, player_id FROM official_player_mappings')) {
        return { rows: [{ provider_player_code: 'P014102', player_id: 101 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 1 };
    }),
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
    const mutations = prepareOfficialGameMutations(db as any, '2026-27');
    await mutations.persistGameData({
      gameCode: 1,
      roundId: 10,
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
    expect(sql).toContain('UPDATE matches SET');
    expect(sql).toContain('INSERT INTO player_round_stats');
    expect(sql).toContain('ON CONFLICT (season_id, player_id, round_id)');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });

  it('replaces all granular datasets transactionally when a game finishes', async () => {
    const { db, client } = database();
    const mutations = prepareOfficialGameMutations(db as any, '2026-27');
    await mutations.persistGameData({
      gameCode: 1,
      roundId: 10,
      report: null,
      metadata: null,
      boxscore: [stat],
      playByPlay: [],
      shots: [],
      checksum: 'final',
      finalized: true,
    });
    const sql = client.query.mock.calls.map(([statement]) => statement).join('\n');
    expect(sql).toContain('DELETE FROM official_play_by_play');
    expect(sql).toContain('DELETE FROM official_shots');
    expect(sql).not.toContain('DELETE FROM official_player_game_stats');
    expect(sql).toContain('UPDATE matches SET');
    expect(client.query.mock.calls[0][0]).toBe('BEGIN');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
  });

  it('upserts sporting fields into player_round_stats without overwriting Biwenger fantasy points', async () => {
    const { db, client } = database();
    const mutations = prepareOfficialGameMutations(db as any, '2026-27');
    await mutations.persistGameData({
      gameCode: 1,
      roundId: 10,
      report: null,
      metadata: null,
      boxscore: [stat],
      playByPlay: [],
      shots: [],
      checksum: 'final',
      finalized: true,
    });
    const playerRoundStatCall = client.query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO player_round_stats')
    );
    expect(playerRoundStatCall).toBeDefined();
    const [sql, params] = playerRoundStatCall!;
    // Fantasy points is preserved and not updated by the sporting boxscore upsert
    expect(sql).not.toContain('fantasy_points = EXCLUDED');
    expect(params![0]).toBe('2026-27');
    expect(params![1]).toBe(101); // player_id mapped from P014102
    expect(params![2]).toBe(10); // round_id
  });
});
