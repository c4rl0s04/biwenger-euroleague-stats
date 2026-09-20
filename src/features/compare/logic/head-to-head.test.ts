import { expect, it } from 'vitest';
import { calculateHeadToHead } from './head-to-head';
import type { HeadToHeadProps, CompareHistory } from '../models/compare';

function round(round_number: number, actual_points: number, ideal_points: number) {
  return {
    round_id: round_number,
    round_number,
    round_name: 'J' + round_number,
    actual_points,
    ideal_points,
    efficiency: 100,
    participated: true,
  };
}
const captain = {
  total_rounds: 0,
  extra_points: 0,
  avg_points: 0,
  most_used: [],
  best_round: { name: '', points: 0 },
  worst_round: { name: '', points: 0 },
};
const homeAway = { total_home: 0, total_away: 0, avg_home: 0, avg_away: 0, difference_pct: 0 };
const users = [
  { id: '1', name: 'One', icon: null, color_index: 0 },
  { id: '2', name: 'Two', icon: null, color_index: 1 },
];
const histories: CompareHistory[] = [
  {
    userId: '1',
    history: [round(1, 20, 25), round(2, 10, 15), round(3, 5, 10)],
    captain,
    homeAway,
    squadStats: { avgPlayerPoints: 10, bestPlayer: { name: 'P', points: 20 } },
  },
  {
    userId: '2',
    history: [round(1, 10, 15), round(2, 10, 15), round(3, 8, 10)],
    captain,
    homeAway,
    squadStats: { avgPlayerPoints: 0, bestPlayer: { name: '-', points: 0 } },
  },
];
const props: HeadToHeadProps & { rivalId: string } = {
  currentUser: users[0],
  rivalId: '2',
  usersList: users,
  allUsersHistory: histories,
  advancedStats: { market: [] },
};

it('preserves round intersections, wins/ties/losses, positive loss and five-round divisor', () => {
  const before = JSON.stringify(props);
  expect(calculateHeadToHead(props)).toMatchObject({
    record: { wins: 1, ties: 1, losses: 1 },
    form: { user: { value: 7 }, rival: { value: 5.6 } },
    rounds: { user: { pointsLost: { value: 15 }, totalRounds: 3 } },
    general: { user: { avgPlayer: { value: 10 }, bestPlayer: { name: 'P', points: 20 } } },
  });
  expect(JSON.stringify(props)).toBe(before);
});
it('prefers the official rivalry matrix when present', () => {
  expect(
    calculateHeadToHead({
      ...props,
      advancedStats: {
        ...props.advancedStats,
        rivalryMatrix: { '1': { '2': { wins: 8, losses: 2, ties: 1 } } },
      },
    })
  ).toMatchObject({ record: { wins: 8, losses: 2, ties: 1 } });
});
it('preserves no-current, no-rival and no-history blank states', () => {
  expect(calculateHeadToHead({ ...props, currentUser: undefined })).toBeNull();
  expect(calculateHeadToHead({ ...props, rivalId: null })).toBeNull();
  expect(calculateHeadToHead({ ...props, allUsersHistory: [] })).toBeNull();
});
