import { describe, expect, it, vi } from 'vitest';
import { preparePlayerMutations } from '../players';

const player = {
  id: 1,
  name: 'Current Name',
  team_id: 2,
  position: 'Base',
  puntos: 10,
  partidos_jugados: 1,
  played_home: 1,
  played_away: 0,
  points_home: 10,
  points_away: 0,
  points_last_season: 100,
  status: 'ok',
  price_increment: 5,
  price: 1_000_000,
  img: 'new-image',
};

describe('new-season identity isolation', () => {
  it('never updates an existing global player while updating only 2026-27 state', async () => {
    const db = {
      query: vi.fn(async (_sql: string, _params?: any[]) => ({ rows: [], rowCount: 1 })),
    };
    await preparePlayerMutations(db as any, { seasonId: '2026-27' }).upsertPlayer(player);
    const globalSql = db.query.mock.calls[0][0];
    const seasonSql = db.query.mock.calls[1][0];
    expect(globalSql).toContain('ON CONFLICT(id) DO NOTHING');
    expect(globalSql).not.toContain('DO UPDATE');
    expect(seasonSql).toContain('INSERT INTO player_seasons');
    expect(db.query.mock.calls[1][1]?.[0]).toBe('2026-27');
  });

  it('does not overwrite global team names, codes, or images for a future season', async () => {
    const db = {
      query: vi.fn(async (_sql: string, _params?: any[]) => ({ rows: [], rowCount: 1 })),
    };
    await preparePlayerMutations(db as any, { seasonId: '2026-27' }).upsertTeam({
      id: 2,
      name: 'New Sponsor Name',
      short_name: 'New Name',
      img: 'new-image',
    });
    expect(db.query.mock.calls[0][0]).toContain('ON CONFLICT(id) DO NOTHING');
  });
});
