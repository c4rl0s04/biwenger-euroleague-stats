import { describe, it, expect } from 'vitest';
import { calculateRegularTimeScores, getStandingsScores } from '@/lib/logic/match-scores';

describe('calculateRegularTimeScores', () => {
  it('returns null scores when header is null', () => {
    const result = calculateRegularTimeScores(null);
    expect(result.homeScore).toBeNull();
    expect(result.awayScore).toBeNull();
  });

  it('returns null scores when header is undefined', () => {
    const result = calculateRegularTimeScores(undefined);
    expect(result.homeScore).toBeNull();
    expect(result.awayScore).toBeNull();
  });

  it('returns null scores when no quarter data is present', () => {
    const result = calculateRegularTimeScores({ ScoreA: 90, ScoreB: 85 });
    expect(result.homeScore).toBeNull();
    expect(result.awayScore).toBeNull();
  });

  it('sums Q1-Q4 to compute regular time scores', () => {
    const header = {
      Q1ScoreA: 25, Q1ScoreB: 20,
      Q2ScoreA: 22, Q2ScoreB: 18,
      Q3ScoreA: 20, Q3ScoreB: 25,
      Q4ScoreA: 23, Q4ScoreB: 22,
    };
    const result = calculateRegularTimeScores(header);
    expect(result.homeScore).toBe(90); // 25+22+20+23
    expect(result.awayScore).toBe(85); // 20+18+25+22
  });

  it('ignores overtime when computing regular time', () => {
    const header = {
      Q1ScoreA: 25, Q1ScoreB: 20,
      Q2ScoreA: 22, Q2ScoreB: 18,
      Q3ScoreA: 20, Q3ScoreB: 25,
      Q4ScoreA: 20, Q4ScoreB: 24,
      OT1ScoreA: 10, OT1ScoreB: 5, // overtime - not counted
    };
    const result = calculateRegularTimeScores(header);
    expect(result.homeScore).toBe(87);
    expect(result.awayScore).toBe(87);
  });
});

describe('getStandingsScores', () => {
  it('returns regular time scores when available', () => {
    const match = {
      home_score_regtime: 88,
      away_score_regtime: 82,
      home_score: 95,
      away_score: 90,
    };
    const result = getStandingsScores(match);
    expect(result.homeScore).toBe(88);
    expect(result.awayScore).toBe(82);
  });

  it('falls back to final scores when regular time not available', () => {
    const match = {
      home_score_regtime: null,
      away_score_regtime: null,
      home_score: 95,
      away_score: 90,
    };
    const result = getStandingsScores(match);
    expect(result.homeScore).toBe(95);
    expect(result.awayScore).toBe(90);
  });

  it('returns 0 scores when all scores are null', () => {
    const match = {
      home_score_regtime: null,
      away_score_regtime: null,
      home_score: null,
      away_score: null,
    };
    const result = getStandingsScores(match);
    expect(result.homeScore).toBe(0);
    expect(result.awayScore).toBe(0);
  });

  it('prefers regtime even when final scores differ', () => {
    const match = {
      home_score_regtime: 80,
      away_score_regtime: 80,
      home_score: 90,
      away_score: 85,
    };
    const result = getStandingsScores(match);
    expect(result.homeScore).toBe(80);
    expect(result.awayScore).toBe(80);
  });
});
