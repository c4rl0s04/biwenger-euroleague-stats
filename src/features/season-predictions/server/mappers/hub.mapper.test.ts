import { describe, expect, it } from 'vitest';
import { PREDICTION_QUESTIONS, sectionsForQuestionSet } from '../../models/questions';
import type { PlayoffsPageData, SeasonPredictionsPageData } from '../../models/submission';
import type { PreseasonOutcomes } from '../../models/preseason-scoring';
import { mapSeasonPredictionsHub } from './hub.mapper';

const options = {
  players: [
    { id: 'p1', name: 'Ana Player', image: null },
    { id: 'p2', name: 'Bo Player', image: null },
  ],
  teams: [
    { id: 't1', name: 'Madrid', image: null },
    { id: 't2', name: 'Barça', image: null },
    { id: 't3', name: 'Olympiacos', image: null },
    { id: 't4', name: 'Fenerbahçe', image: null },
  ],
  managers: [
    { id: 'u1', name: 'Ana', image: null },
    { id: 'u2', name: 'Bruno', image: null },
  ],
};

function preseason(status: SeasonPredictionsPageData['status']): SeasonPredictionsPageData {
  return {
    seasonId: '2026-27',
    status,
    opensAt: '2026-10-02T09:00:00.000Z',
    locksAt: '2026-10-09T09:00:00.000Z',
    locksAtLabel: '9 de octubre',
    serverNow: '2026-11-20T09:00:00.000Z',
    questionSetVersion: 'season-predictions-v1',
    questions: [...PREDICTION_QUESTIONS],
    sections: sectionsForQuestionSet('season-predictions-v1', PREDICTION_QUESTIONS),
    options,
    submission: {
      answers: {
        'player-total-points': { kind: 'single', id: 'p1' },
        'player-underrated': { kind: 'single', id: 'p2' },
      },
      revision: 1,
      updatedAt: '2026-10-03T09:00:00.000Z',
    },
    league:
      status === 'locked'
        ? [
            {
              userId: 'u1',
              name: 'Ana',
              image: null,
              answers: { 'player-total-points': { kind: 'single', id: 'p1' } },
              updatedAt: '2026-10-03T09:00:00.000Z',
            },
            {
              userId: 'u2',
              name: 'Bruno',
              image: null,
              answers: { 'player-total-points': { kind: 'single', id: 'p2' } },
              updatedAt: '2026-10-03T09:00:00.000Z',
            },
          ]
        : null,
  };
}

const playoffs: PlayoffsPageData = {
  seasonId: '2026-27',
  status: 'not-open',
  opensAt: null,
  locksAt: null,
  locksAtLabel: null,
  serverNow: '2026-11-20T09:00:00.000Z',
  template: null,
  seeds: [],
  submission: null,
  league: null,
};

const outcomes: PreseasonOutcomes = {
  'player-total-points': { kind: 'single', status: 'provisional', leaderIds: ['p1'] },
  'team-ranking': {
    kind: 'ranking',
    status: 'provisional',
    standings: [
      { id: 't1', position: 1 },
      { id: 't2', position: 2 },
      { id: 't3', position: 3 },
      { id: 't4', position: 4 },
    ],
  },
};

describe('mapSeasonPredictionsHub', () => {
  it('keeps results and the league table hidden while the preseason window is open', () => {
    const hub = mapSeasonPredictionsHub({
      preseason: preseason('open'),
      playoffs,
      outcomes: null,
    });
    expect(hub.activePhase).toBe('preseason');
    expect(hub.preseasonResults).toBeNull();
    expect(hub.leaderboard).toBeNull();
    expect(hub.phases.map((phase) => [phase.phase, phase.window, phase.results])).toEqual([
      ['preseason', 'open', 'pending'],
      ['playoffs', 'not-open', 'pending'],
    ]);
  });

  it('scores locked preseason answers, names the real outcome and ranks the league', () => {
    const hub = mapSeasonPredictionsHub({ preseason: preseason('locked'), playoffs, outcomes });
    expect(hub.phases[0].results).toBe('provisional');
    expect(hub.activePhase).toBe('preseason');
    expect(hub.preseasonResults?.points).toBe(5);
    expect(hub.preseasonResults?.questions['player-total-points']).toEqual({
      scored: true,
      status: 'provisional',
      points: 5,
      actual: 'Ana Player',
    });
    expect(hub.preseasonResults?.questions['player-underrated'].scored).toBe(false);
    expect(hub.preseasonResults?.questions['team-ranking'].actual).toBe(
      '1. Madrid · 2. Barça · 3. Olympiacos …'
    );
    expect(hub.preseasonResults?.questions['team-champion'].actual).toBeNull();
    expect(
      hub.leaderboard?.map((row) => [row.rank, row.name, row.total, row.phases.preseason])
    ).toEqual([
      [1, 'Ana', 5, 5],
      [2, 'Bruno', 0, 0],
    ]);
  });
});
