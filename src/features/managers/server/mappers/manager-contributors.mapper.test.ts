import { describe, expect, it } from 'vitest';
import { mapManagerContributor } from './manager-contributors.mapper';

describe('manager contributor projection', () => {
  it.each([
    ['12.9', 12],
    ['-4.7', -4],
    ['7abc', 7],
    ['0', 0],
    ['', 0],
    [null, 0],
    ['bad', 0],
  ] as const)('retains parseInt-or-zero conversion for %s', (value, expected) => {
    expect(
      mapManagerContributor({
        player_id: 7,
        player_name: null,
        player_img: null,
        total_base_points: value,
        total_contribution: value,
        games_played: value,
      })
    ).toEqual({
      player_id: 7,
      player_name: null,
      player_img: null,
      total_base_points: expected,
      total_contribution: expected,
      games_played: expected,
    });
  });
  it('allowlists fields and preserves serializable nullable player identity', () => {
    const row = {
      player_id: 7,
      player_name: null,
      player_img: null,
      total_base_points: '14',
      total_contribution: '28',
      games_played: '2',
      password: 'excluded',
    };
    const model = mapManagerContributor(row);
    expect(model).not.toHaveProperty('password');
    expect(JSON.parse(JSON.stringify(model))).toEqual(model);
    expect(Object.keys(model)).toEqual([
      'player_id',
      'player_name',
      'player_img',
      'total_base_points',
      'total_contribution',
      'games_played',
    ]);
  });
});
