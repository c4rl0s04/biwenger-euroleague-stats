import { describe, expect, it } from 'vitest';
import { pickActivePhase, type PhaseState } from './phases';

const state = (
  phase: PhaseState['phase'],
  window: PhaseState['window'],
  results: PhaseState['results'] = 'pending'
): PhaseState => ({ phase, window, results });

describe('pickActivePhase', () => {
  it('prefers the open phase', () => {
    expect(pickActivePhase([state('preseason', 'locked'), state('playoffs', 'open')])).toBe(
      'playoffs'
    );
    expect(pickActivePhase([state('preseason', 'open'), state('playoffs', 'not-open')])).toBe(
      'preseason'
    );
  });

  it('falls back to the latest locked phase whose results are not final', () => {
    expect(
      pickActivePhase([state('preseason', 'locked', 'provisional'), state('playoffs', 'locked')])
    ).toBe('playoffs');
    expect(
      pickActivePhase([
        state('preseason', 'locked', 'provisional'),
        state('playoffs', 'locked', 'final'),
      ])
    ).toBe('preseason');
  });

  it('defaults to preseason', () => {
    expect(pickActivePhase([])).toBe('preseason');
    expect(
      pickActivePhase([state('preseason', 'locked', 'final'), state('playoffs', 'not-open')])
    ).toBe('preseason');
  });
});
