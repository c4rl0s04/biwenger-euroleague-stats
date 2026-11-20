import { describe, expect, it } from 'vitest';
import { combineLeaderboard } from './leaderboard';

const member = (userId: string, name: string) => ({ userId, name, image: null });

describe('combineLeaderboard', () => {
  it('sums phases, keeps the per-phase breakdown and orders by total then name', () => {
    const rows = combineLeaderboard(
      [member('u1', 'Zoe'), member('u2', 'Álvaro'), member('u3', 'Bea'), member('u4', 'Carla')],
      new Map([
        ['u1', { points: 10, provisional: false }],
        ['u2', { points: 4, provisional: false }],
        ['u3', { points: 14, provisional: false }],
      ]),
      new Map([
        ['u1', { points: 4, provisional: true }],
        ['u2', { points: 10, provisional: false }],
      ])
    );
    expect(rows.map((row) => [row.userId, row.rank, row.total])).toEqual([
      ['u2', 1, 14], // Álvaro sorts before Bea and Zoe in Spanish collation
      ['u3', 1, 14],
      ['u1', 1, 14],
      ['u4', 4, 0],
    ]);
    expect(rows[0].phases).toEqual({ preseason: 4, playoffs: 10 });
    expect(rows[1].phases).toEqual({ preseason: 14, playoffs: null });
    expect(rows[3].phases).toEqual({ preseason: null, playoffs: null });
  });

  it('flags a row provisional when any of its phases is provisional', () => {
    const rows = combineLeaderboard(
      [member('u1', 'Ana'), member('u2', 'Luis')],
      new Map([
        ['u1', { points: 3, provisional: true }],
        ['u2', { points: 1, provisional: false }],
      ]),
      new Map()
    );
    expect(rows.map((row) => row.provisional)).toEqual([true, false]);
  });

  it('breaks identical names by user id for a stable order', () => {
    const rows = combineLeaderboard([member('b', 'Sam'), member('a', 'Sam')], new Map(), new Map());
    expect(rows.map((row) => row.userId)).toEqual(['a', 'b']);
  });
});
