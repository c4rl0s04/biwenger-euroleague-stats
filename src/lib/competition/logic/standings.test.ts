import { expect, it } from 'vitest';
import { calculateTeamStandings, getStandingsArray, type StandingsMatch } from './standings';
const match = (
  home: number,
  away: number,
  homeScore: number,
  awayScore: number
): StandingsMatch => ({
  home_id: home,
  away_id: away,
  home_score: homeScore,
  away_score: awayScore,
  status: 'finished',
});
it('uses final scores for wins and regulation scores for points, excluding unfinished games', () => {
  const standings = calculateTeamStandings([
    { ...match(1, 2, 90, 85), home_score_regtime: 80, away_score_regtime: 80 },
    { ...match(1, 3, 10, 20), status: 'live' },
  ]);
  expect(standings.get(1)).toMatchObject({
    wins: 1,
    pointsFor: 80,
    pointsAgainst: 80,
    gamesPlayed: 1,
  });
  expect(standings.has(3)).toBe(false);
});
it('breaks an equal-win tie by completed head-to-head point difference', () => {
  const standings = getStandingsArray([match(1, 2, 90, 80), match(2, 1, 85, 80)]);
  expect(standings.map((team) => team.team_id)).toEqual([1, 2]);
});
it('returns no standings for an empty schedule', () => expect(getStandingsArray([])).toEqual([]));
