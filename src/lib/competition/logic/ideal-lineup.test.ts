import { describe, expect, it } from 'vitest';

import { selectIdealLineup } from './ideal-lineup';

describe('ideal lineup selection', () => {
  it('reuses the five-starter formation and multiplier rules used by rounds', () => {
    const players = [
      [1, 'Base', 30],
      [2, 'Base', 29],
      [3, 'Base', 28],
      [4, 'Base', 27],
      [5, 'Alero', 26],
      [6, 'Alero', 25],
      [7, 'Pivot', 24],
      [8, 'Pivot', 23],
      [9, 'Pivot', 22],
      [10, 'Alero', 21],
      [11, 'Base', 20],
    ].map(([playerId, position, points]) => ({
      player_id: Number(playerId),
      position: String(position),
      points: Number(points),
    }));

    const result = selectIdealLineup(players);

    expect(result.idealLineup.map((player) => player.player_id)).toEqual([
      1, 2, 3, 5, 6, 4, 7, 8, 9, 10,
    ]);
    expect(result.idealLineup.map((player) => player.multiplier)).toEqual([
      2, 1, 1, 1, 1, 0.75, 0.5, 0.5, 0.5, 0.5,
    ]);
    expect(result.idealLineup[0]).toMatchObject({ role: 'titular', is_captain: true });
    expect(result.idealLineup[5]).toMatchObject({ role: '6th_man', is_captain: false });
    expect(result.totalPoints).toBe(233);
  });
});
