import { expect, it } from 'vitest';
import { hasMissingRoundPoints, selectRoundManager } from './desktop-round';
import {
  lineup as emptyLineup,
  lineupPlayer,
  standing,
} from '../server/services/round-read.fixtures';
import type { RoundCompleteViewModel } from '../models/round-read';

const lineup = { ...emptyLineup, players: [lineupPlayer] };
const payload = (users: unknown[]) => ({ users }) as RoundCompleteViewModel;
it('keeps a valid quick squad when background details are missing', () => {
  const quick = { ...standing, lineup };
  expect(selectRoundManager(payload([quick]), payload([standing]), 7)).toBe(quick);
  expect(selectRoundManager(payload([quick]), payload([standing]), 8)).toBeUndefined();
});
it('uses a complete background squad when the selected quick result is unavailable', () => {
  const full = { ...standing, lineup };
  expect(selectRoundManager(payload([standing]), payload([full]), 7)).toBe(full);
});
it('distinguishes missing points from a genuine zero or calculated result', () => {
  expect(hasMissingRoundPoints({ raw_points: null, calculated: false })).toBe(true);
  expect(hasMissingRoundPoints({ raw_points: 0, calculated: false })).toBe(false);
  expect(hasMissingRoundPoints({ raw_points: null, calculated: true })).toBe(false);
});

it('distinguishes missing ideal scores from scored players and genuine zeroes', () => {
  expect(hasMissingRoundPoints({ points: null })).toBe(true);
  expect(hasMissingRoundPoints({ points: 0 })).toBe(false);
  expect(hasMissingRoundPoints({ points: 36 })).toBe(false);
});
