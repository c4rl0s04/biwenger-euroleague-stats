import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mapPlayoffLeaderboard } from '@/features/playoffs/server/mappers/playoffs.mapper';
import type { PlayoffFacts } from '@/features/playoffs/server/queries/playoff.records';
import { EUROLEAGUE_BRACKET_V1, scoreBracket } from '../../models/bracket';
import type { LegacyPlayoffRows } from '../queries/legacy-playoffs.query';
import { mapLegacyPlayoffs } from './legacy-playoffs.mapper';

interface LegacyImport {
  predictions: { userId: string; stage: string; matchId: string; predictedWinnerName: string }[];
  media: { userId: string; predictionImageUrl: string }[];
  results: { matchId: string; winnerName: string; score: string; isCompleted: boolean }[];
}

const data: LegacyImport = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL('../../../../lib/sync/playoffs/playoff-data/2025-26.json', import.meta.url)
    ),
    'utf8'
  )
);

// Stand-in team ids for the legacy name lookup done by the importer.
const teamIds = new Map<string, number>();
const teamId = (name: string) => {
  if (!teamIds.has(name)) teamIds.set(name, teamIds.size + 1);
  return teamIds.get(name)!;
};
const userIds = Array.from(new Set(data.predictions.map((row) => row.userId))).concat('no-picks');

const legacyFacts: PlayoffFacts = {
  allUsers: userIds.map((id, index) => ({ id, name: id, icon: null, colorIndex: index })),
  predictions: data.predictions.map((row, index) => ({
    id: index + 1,
    seasonId: '2025-26',
    userId: row.userId,
    stage: row.stage,
    matchId: row.matchId,
    predictedWinnerId: teamId(row.predictedWinnerName),
    predictionDetails: 'Winner',
    points: 0,
    createdAt: null,
  })),
  results: data.results.map((row) => ({
    matchId: row.matchId,
    winnerId: teamId(row.winnerName),
    score: row.score,
    isCompleted: row.isCompleted,
  })),
  media: data.media,
};

const rows: LegacyPlayoffRows = {
  members: userIds.map((userId) => ({ userId, name: userId, image: null })),
  predictions: legacyFacts.predictions.map((row) => ({
    userId: row.userId!,
    matchId: row.matchId!,
    predictedWinnerId: row.predictedWinnerId!,
  })),
  results: legacyFacts.results.map((row) => ({
    matchId: row.matchId!,
    winnerId: row.winnerId,
    score: row.score,
    isCompleted: row.isCompleted,
  })),
  media: data.media,
};

describe('mapLegacyPlayoffs', () => {
  it('matches the legacy leaderboard totals for 2025-26', () => {
    const legacy = mapPlayoffLeaderboard(legacyFacts);
    const adapted = mapLegacyPlayoffs(rows);
    const totals = Object.fromEntries(
      rows.members.map(({ userId }) => [
        userId,
        scoreBracket(
          EUROLEAGUE_BRACKET_V1,
          adapted.answersByUser.get(userId) ?? {},
          adapted.results
        ).points,
      ])
    );
    expect(totals).toEqual(Object.fromEntries(legacy.map((row) => [row.userId, row.points])));
    expect(legacy.some((row) => row.points > 0)).toBe(true);
    expect(totals['no-picks']).toBe(0);
  });

  it('keeps every legacy pick and media image', () => {
    const adapted = mapLegacyPlayoffs(rows);
    const picks = Array.from(adapted.answersByUser.values()).reduce(
      (total, answers) => total + Object.keys(answers).length,
      0
    );
    expect(picks).toBe(data.predictions.length);
    expect(adapted.imageByUser.size).toBe(data.media.length);
    expect(Object.values(adapted.results).every((result) => result.complete)).toBe(true);
  });
});
