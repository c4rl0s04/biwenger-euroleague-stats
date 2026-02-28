import { describe, it, expect } from 'vitest';
import { calculateBiwengerPoints } from '@/lib/utils/fantasy-scoring';

describe('calculateBiwengerPoints', () => {
  it('returns 0 for null input', () => {
    expect(calculateBiwengerPoints(null)).toBe(0);
  });

  it('returns 0 for undefined input', () => {
    expect(calculateBiwengerPoints(undefined)).toBe(0);
  });

  it('returns 0 for empty stats object', () => {
    expect(calculateBiwengerPoints({})).toBe(0);
  });

  it('scores points at +1 each', () => {
    expect(calculateBiwengerPoints({ points: 10 })).toBe(10);
  });

  it('scores assists at +1.5 each', () => {
    // 4 assists = 6 → ceil(6) = 6
    expect(calculateBiwengerPoints({ assists: 4 })).toBe(6);
  });

  it('scores rebounds at +1.2 each', () => {
    // 5 rebounds = 6 → ceil(6) = 6
    expect(calculateBiwengerPoints({ rebounds: 5 })).toBe(6);
  });

  it('scores steals at +2 each', () => {
    expect(calculateBiwengerPoints({ steals: 3 })).toBe(6);
  });

  it('scores blocks at +2 each', () => {
    expect(calculateBiwengerPoints({ blocks: 2 })).toBe(4);
  });

  it('deducts -2 per turnover', () => {
    expect(calculateBiwengerPoints({ turnovers: 3 })).toBe(-6);
  });

  it('deducts -0.3 per missed 2FG', () => {
    // 4 attempted, 2 made = 2 missed (−0.6) + 1 point = 0.4 → ceil = 1
    expect(
      calculateBiwengerPoints({
        points: 1,
        two_points_attempted: 4,
        two_points_made: 2,
      })
    ).toBe(1);
  });

  it('deducts -0.5 per missed 3FG', () => {
    // 4 attempted, 2 made = 2 missed → -1 → ceil(-1) = -1
    expect(calculateBiwengerPoints({ three_points_attempted: 4, three_points_made: 2 })).toBe(-1);
  });

  it('deducts -0.5 per missed FT', () => {
    // 4 attempted, 2 made = 2 missed → -1 → ceil(-1) = -1
    expect(calculateBiwengerPoints({ free_throws_attempted: 4, free_throws_made: 2 })).toBe(-1);
  });

  it('rounds up (ceil) the final score', () => {
    // 1 rebound = +1.2 → ceil(1.2) = 2
    expect(calculateBiwengerPoints({ rebounds: 1 })).toBe(2);
  });

  it('calculates a realistic player game correctly', () => {
    // 20 pts, 5/8 2FG (3 missed), 3/5 3FG (2 missed), 5/6 FT (1 missed),
    // 5 ast, 6 reb, 1 stl, 2 to, 1 blk
    const stats = {
      points: 20,
      two_points_attempted: 8,
      two_points_made: 5, // 3 missed → -0.9
      three_points_attempted: 5,
      three_points_made: 3, // 2 missed → -1.0
      free_throws_attempted: 6,
      free_throws_made: 5, // 1 missed → -0.5
      assists: 5, // +7.5
      rebounds: 6, // +7.2
      steals: 1, // +2
      turnovers: 2, // -4
      blocks: 1, // +2
    };
    // score = 20 - 0.9 - 1.0 - 0.5 + 7.5 + 7.2 + 2 - 4 + 2 = 32.3 → ceil = 33
    expect(calculateBiwengerPoints(stats)).toBe(33);
  });
});
