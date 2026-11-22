import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseOfficialPhase } from '@/lib/api/euroleague/phase';
import {
  EUROLEAGUE_BRACKET_V1 as T,
  deriveActualResults,
  pruneInvalidPicks,
  resolveParticipants,
  scoreBracket,
  validateBracketAnswers,
  type BracketAnswers,
  type PostseasonGame,
} from './bracket';

// 2025-26 final RS seeds, using official codes as team ids.
const SEEDS = ['OLY', 'PAM', 'MAD', 'ULK', 'ZAL', 'HTA', 'PAN', 'MCO', 'BAR', 'RED'].map(
  (teamId, index) => ({ seed: index + 1, teamId })
);

const readJson = (relative: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8'));

function fixtureGames(): PostseasonGame[] {
  const schedule = readJson('../../../lib/api/__fixtures__/advanced/schedule-postseason.json');
  const reports = new Map<number, any>(
    readJson('../../../lib/api/__fixtures__/advanced/report-postseason.json').map((row: any) => [
      row.Gamecode,
      row,
    ])
  );
  return schedule.map((row: any) => {
    const report = reports.get(Number(row.game));
    return {
      phase: parseOfficialPhase(row.round, row.group),
      homeTeamId: row.homecode,
      awayTeamId: row.awaycode,
      isPlayed: row.played === 'true',
      homeScore: report['local.score'],
      awayScore: report['road.score'],
    };
  });
}

const game = (
  phase: string,
  home: string,
  away: string,
  homeScore: number | null,
  awayScore: number | null
): PostseasonGame => ({
  phase,
  homeTeamId: home,
  awayTeamId: away,
  isPlayed: homeScore !== null,
  homeScore,
  awayScore,
});

const FULL_PICKS: BracketAnswers = {
  'PI-1': { winner: 'PAN' },
  'PI-2': { winner: 'BAR' },
  'PI-3': { winner: 'MCO' },
  'QF-1': { winner: 'OLY', score: '3-0' },
  'QF-2': { winner: 'PAM', score: '3-1' },
  'QF-3': { winner: 'MAD', score: '3-1' },
  'QF-4': { winner: 'ULK', score: '3-1' },
  'SF-1': { winner: 'OLY' },
  'SF-2': { winner: 'MAD' },
  F: { winner: 'OLY' },
};

describe('EUROLEAGUE_BRACKET_V1', () => {
  it('orders slots so every source precedes its consumers and maxes at 41 points', () => {
    const seen = new Set<string>();
    for (const slot of T.slots) {
      for (const source of [slot.home, slot.away])
        if (!('seed' in source)) expect(seen.has(Object.values(source)[0])).toBe(true);
      seen.add(slot.id);
    }
    const max = T.slots.reduce(
      (total, slot) => total + slot.points + (slot.bestOf > 1 ? T.seriesScoreBonus : 0),
      0
    );
    expect(max).toBe(41);
  });
});

describe('resolveParticipants', () => {
  it('propagates picked winners and sends the PI-1 loser to PI-3', () => {
    const participants = resolveParticipants(T, SEEDS, {
      'PI-1': 'MCO',
      'PI-2': 'RED',
      'PI-3': 'PAN',
      'QF-1': 'PAN',
      'QF-4': 'ZAL',
    });
    expect(participants['PI-3']).toEqual({ home: 'PAN', away: 'RED' });
    expect(participants['QF-1']).toEqual({ home: 'OLY', away: 'PAN' });
    expect(participants['QF-2']).toEqual({ home: 'PAM', away: 'MCO' });
    expect(participants['SF-1']).toEqual({ home: 'PAN', away: 'ZAL' });
    expect(participants['SF-2']).toEqual({ home: null, away: null });
  });

  it('leaves the PI-3 home side empty until PI-1 has a winner', () => {
    expect(resolveParticipants(T, SEEDS, {})['PI-3']).toEqual({ home: null, away: null });
  });
});

describe('validateBracketAnswers', () => {
  it('accepts a complete bracket and a partial one', () => {
    expect(validateBracketAnswers(FULL_PICKS, T, SEEDS)).toEqual(FULL_PICKS);
    expect(validateBracketAnswers({ 'QF-3': { winner: 'HTA' } }, T, SEEDS)).toEqual({
      'QF-3': { winner: 'HTA' },
    });
  });

  it.each([
    ['non-object', []],
    ['unknown slot', { 'QF-9': { winner: 'OLY' } }],
    ['winner outside the tie', { 'QF-3': { winner: 'OLY' } }],
    ['winner implied by a missing earlier pick', { 'QF-2': { winner: 'PAN' } }],
    ['score on a single game', { 'PI-1': { winner: 'PAN', score: '3-0' } }],
    ['unknown series score', { 'QF-3': { winner: 'MAD', score: '4-0' } }],
    ['extra field', { 'QF-3': { winner: 'MAD', points: 99 } }],
    ['inconsistent later pick', { ...FULL_PICKS, 'SF-1': { winner: 'ULK' }, F: { winner: 'OLY' } }],
  ])('rejects %s', (_name, input) => {
    expect(() => validateBracketAnswers(input, T, SEEDS)).toThrow(
      expect.objectContaining({ code: 'invalid' })
    );
  });
});

describe('pruneInvalidPicks', () => {
  it('cascades removals when an earlier pick changes', () => {
    const { 'SF-1': _sf1, F: _final, ...survivors } = FULL_PICKS;
    const changed = { ...FULL_PICKS, 'QF-1': { winner: 'MCO', score: '3-2' } };
    expect(pruneInvalidPicks(T, SEEDS, changed)).toEqual({
      ...survivors,
      'QF-1': { winner: 'MCO', score: '3-2' },
    });
  });

  it('removes the PI-3 pick when its PI-1 loser changes', () => {
    const pruned = pruneInvalidPicks(T, SEEDS, {
      'PI-1': { winner: 'MCO' },
      'PI-2': { winner: 'BAR' },
      'PI-3': { winner: 'MCO' },
    });
    expect(pruned).toEqual({ 'PI-1': { winner: 'MCO' }, 'PI-2': { winner: 'BAR' } });
  });
});

describe('deriveActualResults', () => {
  it('rebuilds the 2025-26 bracket from the PR0 fixtures', () => {
    const results = deriveActualResults(T, SEEDS, fixtureGames());
    const summary = Object.fromEntries(
      Object.values(results).map((result) => [
        result.slotId,
        `${result.home}-${result.away} ${result.winner} ${result.score ?? ''}`.trim(),
      ])
    );
    expect(summary).toEqual({
      'PI-1': 'PAN-MCO PAN',
      'PI-2': 'BAR-RED BAR',
      'PI-3': 'MCO-BAR MCO',
      'QF-1': 'OLY-MCO OLY 3-0',
      'QF-2': 'PAM-PAN PAM 3-2',
      'QF-3': 'MAD-HTA MAD 3-1',
      'QF-4': 'ULK-ZAL ULK 3-1',
      'SF-1': 'OLY-ULK OLY',
      'SF-2': 'PAM-MAD MAD',
      F: 'OLY-MAD OLY',
    });
    expect(Object.values(results).every((result) => result.complete)).toBe(true);
  });

  it('keeps a series open until a team reaches three wins and ignores unplayed games', () => {
    const results = deriveActualResults(T, SEEDS, [
      game('PO', 'MAD', 'HTA', 80, 70),
      game('PO', 'MAD', 'HTA', 70, 80),
      game('PO', 'HTA', 'MAD', 60, 70),
      game('PO', 'HTA', 'MAD', null, null),
      game('RS', 'MAD', 'HTA', 90, 60),
    ]);
    expect(results['QF-3']).toMatchObject({
      wins: { home: 2, away: 1 },
      complete: false,
      winner: null,
      score: null,
    });
    expect(results['SF-2']).toMatchObject({ home: null, away: null, complete: false });
  });

  it('ignores the third-place game', () => {
    const games = fixtureGames().filter((entry) => entry.phase !== 'FF');
    games.push(
      game('FF', 'OLY', 'ULK', 80, 70),
      game('FF', 'PAM', 'MAD', 70, 80),
      game('FF', 'ULK', 'PAM', 90, 60),
      game('FF', 'OLY', 'MAD', null, null)
    );
    const results = deriveActualResults(T, SEEDS, games);
    expect(results.F).toMatchObject({ home: 'OLY', away: 'MAD', complete: false, winner: null });
  });
});

describe('scoreBracket', () => {
  it('scores winners and the exact series bonus against the 2025-26 results', () => {
    const score = scoreBracket(T, FULL_PICKS, deriveActualResults(T, SEEDS, fixtureGames()));
    // QF-1 3-0, QF-3 3-1 and QF-4 3-1 exact; QF-2 was 3-2, not 3-1.
    expect(score.slots['QF-1']).toEqual({ status: 'correct', points: 4, bonus: 1 });
    expect(score.slots['QF-2']).toEqual({ status: 'correct', points: 3, bonus: 0 });
    expect(score.points).toBe(1 + 1 + 1 + 4 + 3 + 4 + 4 + 6 + 6 + 10);
    expect(score.provisional).toBe(false);
  });

  it('marks wrong, pending and unpicked ties and stays provisional', () => {
    const results = deriveActualResults(T, SEEDS, [game('PI', 'PAN', 'MCO', 70, 80)]);
    const score = scoreBracket(
      T,
      { 'PI-1': { winner: 'PAN' }, 'QF-3': { winner: 'MAD', score: '3-0' } },
      results
    );
    expect(score.slots['PI-1']).toEqual({ status: 'wrong', points: 0, bonus: 0 });
    expect(score.slots['QF-3'].status).toBe('pending');
    expect(score.slots.F.status).toBe('unpicked');
    expect(score).toMatchObject({ points: 0, provisional: true });
  });

  it('never awards the bonus without the right winner', () => {
    const score = scoreBracket(
      T,
      { 'QF-3': { winner: 'HTA', score: '3-1' } },
      {
        'QF-3': { complete: true, winner: 'MAD', score: '3-1' },
      }
    );
    expect(score.slots['QF-3']).toEqual({ status: 'wrong', points: 0, bonus: 0 });
  });
});
