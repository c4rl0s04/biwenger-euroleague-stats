import { describe, expect, it } from 'vitest';
import type { LineupPlayer, OptimizationPlayerRow } from '../models/round-query-contracts';
import {
  calculateWeightedSum,
  inferGhostPosition,
  selectOptimalSquad,
} from './round-analysis.logic';

const player = (id: number, position: string | null, points = 1): OptimizationPlayerRow => ({
  player_id: id,
  name: `Player ${id}`,
  position,
  points,
  valuation: 0,
  img: null,
  team_short: null,
  team_img: null,
});
const lineup = (id: number, position: string, role = 'titular', missing = false): LineupPlayer => ({
  ...player(id, position),
  name: `Player ${id}`,
  position,
  valuation: 0,
  team: 'Team',
  is_captain: false,
  role,
  raw_points: null,
  stats_points: 0,
  stats_rebounds: 0,
  stats_assists: 0,
  minutes: null,
  current_status: null,
  player_exists: missing ? null : id,
  points: 1,
  is_missing: missing,
  calculated: false,
});

describe('historical round scoring compatibility', () => {
  it('preserves captain precedence, sixth-man weighting, unknown-role bench weighting and negative scores', () => {
    expect(
      calculateWeightedSum([
        { points: 3, role: 'bench', is_captain: true },
        { points: 4, role: 'titular', is_captain: false },
        { points: 3, role: '6th_man', is_captain: false },
        { points: -1, role: null, is_captain: null },
        { points: null, role: 'titular', is_captain: false },
      ])
    ).toBe(11.75);
  });

  it('retains capped greedy starters, next-best bench, original fields and unrounded totals', () => {
    const input = [
      'Base',
      'Base',
      'Base',
      'Base',
      'Alero',
      'Alero',
      'Pivot',
      'Pivot',
      'Pivot',
      'Alero',
      'Base',
    ].map((position, index) => player(index + 1, position, 11 - index));
    const result = selectOptimalSquad(input);
    expect(result.optimalLineup.map((p) => p.player_id)).toEqual([1, 2, 3, 5, 6, 4, 7, 8, 9, 10]);
    expect(result.optimalLineup.map((p) => p.role)).toEqual([
      'titular',
      'titular',
      'titular',
      'titular',
      'titular',
      '6th_man',
      'bench',
      'bench',
      'bench',
      'bench',
    ]);
    expect(result.optimalLineup.filter((p) => p.is_captain).map((p) => p.player_id)).toEqual([1]);
    expect(result.totalPoints).toBe(67);
    expect(result.optimalLineup[0]).not.toHaveProperty('multiplier');
    expect(input[0]).not.toHaveProperty('role');
    const fractional = selectOptimalSquad(
      ['Base', 'Base', 'Alero', 'Alero', 'Pivot', 'Pivot'].map((p, i) => player(i, p))
    );
    expect(fractional.totalPoints).toBe(6.75);
  });

  it('preserves empty, short, unknown-position and null-position formation behavior', () => {
    expect(selectOptimalSquad([])).toEqual({ optimalLineup: [], totalPoints: 0 });
    expect(selectOptimalSquad([player(1, null)]).totalPoints).toBe(2);
    expect(selectOptimalSquad([player(1, 'Other'), player(2, 'Other')]).optimalLineup).toHaveLength(
      2
    );
  });

  it('infers missing starter from known starters only, with stable Base/Alero/Pivot tie breaking', () => {
    const ghost = lineup(9, 'Bench', 'titular', true);
    expect(
      inferGhostPosition(
        [lineup(1, 'Base'), lineup(2, 'Base'), lineup(3, 'Base'), lineup(4, 'Alero'), ghost],
        ghost
      )
    ).toBe('Pivot');
    expect(inferGhostPosition([ghost], ghost)).toBe('Base');
    const full = ['Base', 'Alero', 'Pivot'].flatMap((p, i) =>
      [0, 1, 2].map((n) => lineup(i * 3 + n, p))
    );
    expect(inferGhostPosition(full, ghost)).toBe('Base');
  });

  it('uses squad rarity for bench/sixth-man ghosts, ignoring unknown/null pool positions', () => {
    const ghost = lineup(9, 'Bench', '6th_man', true);
    expect(
      inferGhostPosition([], ghost, [player(1, 'Base'), player(2, 'Alero'), player(3, null)])
    ).toBe('Pivot');
    expect(inferGhostPosition([], ghost)).toBe('Base');
  });
});
