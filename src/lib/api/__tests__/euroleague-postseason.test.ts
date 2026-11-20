import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { regularSeasonStandingsRound } from '../../sync/services/euroleague/master-data';
import { EuroleagueClient } from '../euroleague/client';
import { parseOfficialPhase } from '../euroleague/phase';

const readJson = (relative: string) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8'));

// E2025 (2025-26): last RS game plus every play-in, playoff and Final Four game.
const scheduleRows = readJson('../__fixtures__/advanced/schedule-postseason.json');
const reportRows = readJson('../__fixtures__/advanced/report-postseason.json');
const legacyResults: { matchId: string; winnerName: string }[] = readJson(
  '../../sync/playoffs/playoff-data.json'
).results;

const LEGACY_TEAM_CODES: Record<string, string> = {
  Panathinaikos: 'PAN',
  Barcelona: 'BAR',
  Monaco: 'MCO',
  Fenerbahce: 'ULK',
  Olympiacos: 'OLY',
  'Real Madrid': 'MAD',
  Valencia: 'PAM',
};

async function loadSchedule() {
  const provider = new EuroleagueClient({
    fetchImpl: vi.fn(async () => new Response(JSON.stringify(scheduleRows))) as typeof fetch,
  });
  return provider.getSchedule(2025);
}

describe('parseOfficialPhase', () => {
  it('classifies every E2025 schedule game', () => {
    const counts: Record<string, number> = {};
    for (const row of scheduleRows) {
      const phase = parseOfficialPhase(row.round, row.group);
      counts[phase] = (counts[phase] ?? 0) + 1;
    }
    expect(counts).toEqual({ RS: 1, PI: 3, PO: 16, FF: 3 });
  });

  it('agrees with the game report phaseType.code', () => {
    const reports = new Map(reportRows.map((row: any) => [row.Gamecode, row]));
    for (const row of scheduleRows) {
      const report: any = reports.get(Number(row.game));
      expect(report?.['phaseType.code']).toBe(parseOfficialPhase(row.round, row.group));
      expect(report?.Round).toBe(row.gameday);
    }
  });

  it.each([
    ['PO', 'PLAYOFF A ', 'PO'],
    ['FF', 'THIRD PLACE GAME', 'FF'],
  ])('accepts report spellings and older formats (%s, %j)', (round, group, expected) => {
    expect(parseOfficialPhase(round, group)).toBe(expected);
  });

  it.each([
    ['QF', 'PLAYOFF A'],
    ['PO', 'A'],
    ['FF', 'QUARTERFINAL A'],
    ['constructor', 'A'],
    [null, 'Regular Season'],
    ['RS', null],
  ])('throws on unknown codes (%j, %j)', (round, group) => {
    expect(() => parseOfficialPhase(round, group)).toThrow(/Unknown EuroLeague phase/);
  });
});

describe('E2025 postseason fixtures', () => {
  it('schedule wall times resolve to the report UTC kickoff', async () => {
    const utc = new Map(reportRows.map((row: any) => [row.Gamecode, row.utcDate]));
    for (const game of await loadSchedule()) {
      expect(game.scheduledAt?.toISOString().replace('.000Z', 'Z')).toBe(utc.get(game.gameCode));
    }
  });

  it('rebuilds the 2025-26 bracket participants and winners', async () => {
    const reports = new Map(reportRows.map((row: any) => [row.Gamecode, row]));
    const ties = new Map<string, { phase: string; wins: Map<string, number> }>();
    for (const game of await loadSchedule()) {
      const phase = parseOfficialPhase(game.roundCode, game.phase);
      if (phase === 'RS') continue;
      const report: any = reports.get(game.gameCode);
      const winner =
        report['local.score'] > report['road.score']
          ? report['local.club.code']
          : report['road.club.code'];
      const tie = ties.get(game.phase!) ?? { phase, wins: new Map() };
      tie.wins.set(game.homeTeamCode, tie.wins.get(game.homeTeamCode) ?? 0);
      tie.wins.set(game.awayTeamCode, tie.wins.get(game.awayTeamCode) ?? 0);
      tie.wins.set(winner, tie.wins.get(winner)! + 1);
      ties.set(game.phase!, tie);
    }
    const summary = Object.fromEntries(
      Array.from(ties).map(([group, tie]) => [
        group,
        Array.from(tie.wins)
          .sort((a, b) => b[1] - a[1])
          .map(([team, wins]) => `${team} ${wins}`),
      ])
    );

    expect(summary).toEqual({
      A: ['PAN 1', 'MCO 0'],
      B: ['BAR 1', 'RED 0'],
      C: ['MCO 1', 'BAR 0'],
      'PLAYOFF A': ['OLY 3', 'MCO 0'],
      'PLAYOFF B': ['ULK 3', 'ZAL 1'],
      'PLAYOFF C': ['MAD 3', 'HTA 1'],
      'PLAYOFF D': ['PAM 3', 'PAN 2'],
      'SEMIFINAL A': ['OLY 1', 'ULK 0'],
      'SEMIFINAL B': ['MAD 1', 'PAM 0'],
      'CHAMPIONSHIP GAME': ['OLY 1', 'MAD 0'],
    });

    const winnerOf = (group: string) => summary[group][0].split(' ')[0];
    const legacy = Object.fromEntries(
      legacyResults.map((result) => [result.matchId, LEGACY_TEAM_CODES[result.winnerName]])
    );
    expect(legacy).toMatchObject({
      'PI-1': winnerOf('A'),
      'PI-2': winnerOf('B'),
      'PI-3': winnerOf('C'),
      'SF-1': winnerOf('SEMIFINAL A'),
      'SF-2': winnerOf('SEMIFINAL B'),
      F: winnerOf('CHAMPIONSHIP GAME'),
    });
    // Legacy QF ids do not follow the official PLAYOFF A-D letters, so compare as a set.
    expect(['QF-1', 'QF-2', 'QF-3', 'QF-4'].map((id) => legacy[id]).sort()).toEqual(
      ['PLAYOFF A', 'PLAYOFF B', 'PLAYOFF C', 'PLAYOFF D'].map(winnerOf).sort()
    );
  });

  it('keeps the standings round on the last played RS gameday', async () => {
    const schedule = await loadSchedule();
    expect(Math.max(...schedule.map((game) => game.roundNumber ?? 0))).toBe(47);
    expect(regularSeasonStandingsRound(schedule)).toBe(38);
    expect(regularSeasonStandingsRound([])).toBe(1);
  });
});
