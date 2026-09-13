import { describe, expect, it } from 'vitest';
import { mapTeamMatchCounts, mapTeamQualificationProbabilities } from './team-competition.mapper';
import type { TeamCompetitionFacts } from '../queries/team-competition.records';

function probability(position: number, wins = 10, recentWins = 6) {
  return mapTeamQualificationProbabilities({
    standings: [{ team_id: '7', position, wins }],
    form: [{ team_id: 7, recent_wins: recentWins, recent_matches: 5 }],
    opponents: [],
  })[7];
}

describe('Team competition projections preserve the existing formula', () => {
  it.each([
    [4, 95],
    [5, 80],
    [6, 80],
    [7, 60],
    [10, 60],
  ])('keeps position %i at %i before form adjustment', (position, expected) =>
    expect(probability(position)).toBe(expected)
  );

  it.each([
    [0, 45],
    [1, 52],
    [2, 58],
    [3, 62],
    [4, 68],
    [5, 75],
    [6, 60],
  ])('preserves recent-wins %i adjustment, including out-of-window values', (wins, expected) =>
    expect(probability(7, 10, wins)).toBe(expected)
  );

  it('uses zero tenth-place wins when absent and clamps both extremes', () => {
    expect(probability(11, 0)).toBe(50);
    expect(probability(11, 10)).toBe(99);
    expect(probability(11, -10)).toBe(1);
    expect(probability(4, 10, 5)).toBe(99);
  });

  it.each([
    [6, 48],
    [7, 60],
    [12, 60],
    [13, 72],
  ])('keeps opponent difficulty threshold at position %i', (position, expected) => {
    expect(
      mapTeamQualificationProbabilities({
        standings: [
          { team_id: 7, position: 7, wins: 10 },
          { team_id: 8, position, wins: 10 },
        ],
        form: [{ team_id: 7, recent_wins: 6, recent_matches: 5 }],
        opponents: [{ team_id: 7, opponent_id: 8 }],
      })[7]
    ).toBe(expected);
  });

  it('counts each ranked opponent once, ignoring duplicates and unknown opponents', () => {
    const facts: TeamCompetitionFacts = {
      standings: [
        { team_id: 7, position: 7, wins: 10 },
        { team_id: 1, position: 1, wins: 20 },
        { team_id: 20, position: 20, wins: 0 },
      ],
      form: [{ team_id: 7, recent_wins: 6, recent_matches: 5 }],
      opponents: [1, 1, 1, 1, 20, 999].map((id) => ({ team_id: 7, opponent_id: id })),
    };
    expect(mapTeamQualificationProbabilities(facts)[7]).toBe(60);
  });

  it('preserves absent form, empty records and numeric count parsing', () => {
    expect(mapTeamQualificationProbabilities({ standings: [], form: [], opponents: [] })).toEqual(
      {}
    );
    expect(
      mapTeamQualificationProbabilities({
        standings: [{ team_id: '7', position: '7', wins: '10' }],
        form: [],
        opponents: [],
      })
    ).toEqual({ 7: 45 });
    expect(
      mapTeamMatchCounts([
        { team_id: '007', count: '4' },
        { team_id: 8, count: 0 },
      ])
    ).toEqual({ 7: 4, 8: 0 });
  });
});
