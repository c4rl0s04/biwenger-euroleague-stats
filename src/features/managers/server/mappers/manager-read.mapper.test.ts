import { describe, expect, it } from 'vitest';
import {
  mapManagerSeasonStats,
  mapManagerSquadPlayer,
  mapManagerSquad,
  mapManagerRounds,
} from './manager-read.mapper';

describe('Manager read models', () => {
  it('preserves nullable squad identity and price fields', () => {
    const row = {
      id: 1,
      name: null,
      position: null,
      team: null,
      team_img: null,
      team_short_name: null,
      price: null,
      price_increment: null,
      points: null,
      average: null,
      img: null,
    };
    expect(mapManagerSquadPlayer(row, '')).toEqual({ ...row, recent_scores: '' });
    expect(mapManagerSquad([mapManagerSquadPlayer(row, '')], 0).total_value).toBe(0);
  });
  it('preserves the missing manager sentinel and normalized aggregate defaults', () => {
    const data = mapManagerSeasonStats('0007', {
      transfers: { purchases: 0, sales: 0, total_spent: 0, total_received: 0 },
    });
    expect(data).toMatchObject({
      id: '0007',
      name: 'Desconocido',
      icon: '',
      total_points: 0,
      position: 0,
      last_transfers: [],
    });
    expect(Object.values(data).every((value) => value !== undefined)).toBe(true);
  });
  it('allowlists transfers and serializes dates without coercing legacy decimal/null fields', () => {
    const date = new Date('2026-01-02T03:04:05.000Z');
    const transfer = {
      player_id: 1,
      player_name: null,
      price: '123',
      comprador: 'A',
      vendedor: null,
      fecha: date,
      type: 'purchase',
      password: 'must-not-escape',
    };
    const data = mapManagerSeasonStats(7, {
      user: { name: 'A', icon: null, color_index: 0 },
      stats: {
        total_points: '12',
        best_round: 12,
        worst_round: 0,
        average_points: '6.5',
        rounds_played: '2',
      },
      transfers: {
        purchases: '1',
        sales: null,
        total_spent: '123',
        total_received: 0,
        last_transfers: [transfer],
      },
    });
    expect(data.average_points).toBe(6.5);
    expect(data.last_transfers).toEqual([
      {
        player_id: 1,
        player_name: null,
        price: '123',
        comprador: 'A',
        vendedor: null,
        fecha: date.toJSON(),
        type: 'purchase',
      },
    ]);
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });
  it('preserves raw squad numeric strings/nulls, order and falling slice semantics', () => {
    const players = Array.from({ length: 10 }, (_, i) =>
      mapManagerSquadPlayer(
        {
          id: i,
          name: String(i),
          position: null,
          team: null,
          team_img: null,
          team_short_name: null,
          price: '100',
          price_increment: '-2',
          points: '9',
          average: '4.5',
          img: null,
          ...{ token: 'exclude' },
        },
        '4,X'
      )
    );
    const data = mapManagerSquad(players, '90');
    expect(data.total_points).toBe('90');
    expect(data.total_value).toBe(1000);
    expect(data.price_trend).toBe(-20);
    expect(data.top_falling.map((p) => p.id)).toEqual([9, 8, 7, 6, 5, 4, 3]);
    expect(data.players[0]).toMatchObject({
      price: '100',
      points: '9',
      average: '4.5',
      position: null,
    });
    expect(data.players[0]).not.toHaveProperty('token');
  });
  it('normalizes round points/position only and strips unknown fields', () => {
    const row = {
      round_id: 2,
      round_name: null,
      points: '18',
      position: '1',
      participated: 1,
      password: 'exclude',
    };
    expect(mapManagerRounds({ rounds: [row], total_played: 2, total_rounds: 3 })).toEqual({
      rounds: [{ round_id: 2, round_name: null, points: 18, position: 1, participated: 1 }],
      total_played: 2,
      total_rounds: 3,
    });
  });
});
