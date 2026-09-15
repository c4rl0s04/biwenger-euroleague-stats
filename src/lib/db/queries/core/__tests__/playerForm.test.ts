import { describe, expect, it } from 'vitest';
import { computePlayerFormScores } from '../playerForm';

describe('computePlayerFormScores', () => {
  it('handles standard mixed scores with observed points, 0, and DNP', () => {
    const result = computePlayerFormScores('12,X,7,0,15');
    expect(result.scores).toEqual(['12', 'X', '7', '0', '15']);
    // Played: 12, 7, 0, 15 -> total = 34 / 4 = 8.5
    expect(result.avg_recent_points).toBe(8.5);
    // Known team matches: 5 (DNPs penalized as 0) -> 34 / 5 = 6.8
    expect(result.avg_form_score).toBe(6.8);
  });

  it('does not treat unknown "?" as DNP ("X") or score 0 in averages', () => {
    const result = computePlayerFormScores('10,?,14,X,?');
    expect(result.scores).toEqual(['10', '?', '14', 'X', '?']);
    // Played matches: '10', '14' (2 matches) -> total = 24 / 2 = 12
    expect(result.avg_recent_points).toBe(12);
    // Known matches: '10', '14', 'X' (3 matches) -> 24 / 3 = 8
    expect(result.avg_form_score).toBe(8);
  });

  it('handles player with only observed zero scores', () => {
    const result = computePlayerFormScores('0,0');
    expect(result.scores).toEqual(['0', '0']);
    expect(result.avg_recent_points).toBe(0);
    expect(result.avg_form_score).toBe(0);
  });

  it('handles player with only DNPs', () => {
    const result = computePlayerFormScores('X,X,X');
    expect(result.scores).toEqual(['X', 'X', 'X']);
    // Played games count is 0, so average over played games is null
    expect(result.avg_recent_points).toBeNull();
    // Known games count is 3 (DNP penalized as 0) -> 0 / 3 = 0
    expect(result.avg_form_score).toBe(0);
  });

  it('returns null for all-unknown recent form (?,?,?) rather than zero', () => {
    const result = computePlayerFormScores('?,?,?');
    expect(result.scores).toEqual(['?', '?', '?']);
    expect(result.avg_recent_points).toBeNull();
    expect(result.avg_form_score).toBeNull();
  });
});
