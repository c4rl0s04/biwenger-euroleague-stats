import { expect, it } from 'vitest';
import { calculateTargetPrice, getStrategyLabel } from './player-finance';

it.each([
  [90, 130],
  [89, 115],
  [75, 115],
  [74, 105],
  [50, 105],
  [49, 95],
  [0, 95],
])('preserves bidding threshold %s', (score, amount) => {
  expect(calculateTargetPrice(100, score)).toBe(amount);
});
it('preserves price defaults and rounding boundaries', () => {
  expect(calculateTargetPrice(undefined)).toBe(0);
  expect(calculateTargetPrice(null)).toBe(0);
  expect(calculateTargetPrice(0)).toBe(0);
  expect(calculateTargetPrice(100)).toBe(95);
  expect(calculateTargetPrice(100001, 50)).toBe(105000);
  expect(calculateTargetPrice(1000001, 50)).toBe(1050000);
  expect(getStrategyLabel(90)).toBe('Fichaje Obligatorio');
  expect(getStrategyLabel()).toBe('Compra Arriesgada / Evitar');
  expect(getStrategyLabel(-1)).toBe('Evitar');
});
