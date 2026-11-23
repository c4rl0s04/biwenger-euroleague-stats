import { PredictionError } from './submission';

export type BracketStage = 'play-in' | 'quarter' | 'semi' | 'final';
export type PostseasonPhaseCode = 'PI' | 'PO' | 'FF';

export type SlotSource = { seed: number } | { winnerOf: string } | { loserOf: string };

export interface BracketSlot {
  /** Matches the legacy playoff_predictions.match_id values (PI-1 … F). */
  id: string;
  stage: BracketStage;
  /** Official phase whose games decide this tie. */
  phase: PostseasonPhaseCode;
  bestOf: number;
  points: number;
  home: SlotSource;
  away: SlotSource;
}

export interface BracketTemplate {
  version: string;
  seedCount: number;
  seriesScoreBonus: number;
  /** Winner-relative series scores accepted for ties with bestOf > 1. */
  seriesScores: readonly string[];
  /** Topologically ordered: every source slot precedes the slots fed by it. */
  slots: readonly BracketSlot[];
}

const seed = (value: number): SlotSource => ({ seed: value });
const winnerOf = (slot: string): SlotSource => ({ winnerOf: slot });
const loserOf = (slot: string): SlotSource => ({ loserOf: slot });

// Base points mirror the legacy SCORING_RULES (src/features/playoffs/server/mappers/playoffs.mapper.ts).
// The third-place game is not part of the bracket and is ignored.
export const EUROLEAGUE_BRACKET_V1: BracketTemplate = Object.freeze({
  version: 'euroleague-v1',
  seedCount: 10,
  seriesScoreBonus: 1,
  seriesScores: Object.freeze(['3-0', '3-1', '3-2']),
  slots: Object.freeze([
    {
      id: 'PI-1',
      stage: 'play-in',
      phase: 'PI',
      bestOf: 1,
      points: 1,
      home: seed(7),
      away: seed(8),
    },
    {
      id: 'PI-2',
      stage: 'play-in',
      phase: 'PI',
      bestOf: 1,
      points: 1,
      home: seed(9),
      away: seed(10),
    },
    {
      id: 'PI-3',
      stage: 'play-in',
      phase: 'PI',
      bestOf: 1,
      points: 1,
      home: loserOf('PI-1'),
      away: winnerOf('PI-2'),
    },
    {
      id: 'QF-1',
      stage: 'quarter',
      phase: 'PO',
      bestOf: 5,
      points: 3,
      home: seed(1),
      away: winnerOf('PI-3'),
    },
    {
      id: 'QF-2',
      stage: 'quarter',
      phase: 'PO',
      bestOf: 5,
      points: 3,
      home: seed(2),
      away: winnerOf('PI-1'),
    },
    {
      id: 'QF-3',
      stage: 'quarter',
      phase: 'PO',
      bestOf: 5,
      points: 3,
      home: seed(3),
      away: seed(6),
    },
    {
      id: 'QF-4',
      stage: 'quarter',
      phase: 'PO',
      bestOf: 5,
      points: 3,
      home: seed(4),
      away: seed(5),
    },
    {
      id: 'SF-1',
      stage: 'semi',
      phase: 'FF',
      bestOf: 1,
      points: 6,
      home: winnerOf('QF-1'),
      away: winnerOf('QF-4'),
    },
    {
      id: 'SF-2',
      stage: 'semi',
      phase: 'FF',
      bestOf: 1,
      points: 6,
      home: winnerOf('QF-2'),
      away: winnerOf('QF-3'),
    },
    {
      id: 'F',
      stage: 'final',
      phase: 'FF',
      bestOf: 1,
      points: 10,
      home: winnerOf('SF-1'),
      away: winnerOf('SF-2'),
    },
  ] satisfies BracketSlot[]),
});

/** Seed position (1-based) → team id, from the final regular-season standings. */
export interface BracketSeed {
  seed: number;
  teamId: string;
}

/** Seed as frozen in a playoffs window snapshot. */
export interface PlayoffSeed extends BracketSeed {
  teamCode: string;
  name: string;
  image: string | null;
}

export interface BracketPick {
  winner: string;
  score?: string;
}

export type BracketAnswers = Record<string, BracketPick>;

export interface SlotParticipants {
  home: string | null;
  away: string | null;
}

export interface PostseasonGame {
  phase: string;
  homeTeamId: string;
  awayTeamId: string;
  isPlayed: boolean;
  homeScore: number | null;
  awayScore: number | null;
}

export interface BracketResult extends SlotParticipants {
  slotId: string;
  wins: { home: number; away: number };
  complete: boolean;
  winner: string | null;
  /** Winner-relative series score ("3-1") for ties with bestOf > 1. */
  score: string | null;
}

export type BracketResults = Record<string, BracketResult>;

function sourceTeam(
  source: SlotSource,
  seedTeams: ReadonlyMap<number, string>,
  decided: ReadonlyMap<string, { winner: string | null; participants: SlotParticipants }>
): string | null {
  if ('seed' in source) return seedTeams.get(source.seed) ?? null;
  const slotId = 'winnerOf' in source ? source.winnerOf : source.loserOf;
  const tie = decided.get(slotId);
  if (!tie?.winner) return null;
  if ('winnerOf' in source) return tie.winner;
  const { home, away } = tie.participants;
  if (!home || !away) return null;
  return tie.winner === home ? away : tie.winner === away ? home : null;
}

function seedMap(seeds: readonly BracketSeed[]) {
  return new Map(seeds.map((entry) => [entry.seed, entry.teamId]));
}

/** Participants of every slot implied by the seeds and a winner per earlier slot (picks or results). */
export function resolveParticipants(
  template: BracketTemplate,
  seeds: readonly BracketSeed[],
  winners: Readonly<Record<string, string | null | undefined>>
): Record<string, SlotParticipants> {
  const seedTeams = seedMap(seeds);
  const decided = new Map<string, { winner: string | null; participants: SlotParticipants }>();
  const result: Record<string, SlotParticipants> = {};
  for (const slot of template.slots) {
    const participants = {
      home: sourceTeam(slot.home, seedTeams, decided),
      away: sourceTeam(slot.away, seedTeams, decided),
    };
    const winner = winners[slot.id];
    const valid = winner && (winner === participants.home || winner === participants.away);
    decided.set(slot.id, { winner: valid ? winner : null, participants });
    result[slot.id] = participants;
  }
  return result;
}

const pairKey = (left: string, right: string) => [left, right].sort().join('|');

/** Actual tie outcomes from official games: wins per team pair within the slot's phase. */
export function deriveActualResults(
  template: BracketTemplate,
  seeds: readonly BracketSeed[],
  games: readonly PostseasonGame[]
): BracketResults {
  const seedTeams = seedMap(seeds);
  const decided = new Map<string, { winner: string | null; participants: SlotParticipants }>();
  const results: BracketResults = {};
  for (const slot of template.slots) {
    const home = sourceTeam(slot.home, seedTeams, decided);
    const away = sourceTeam(slot.away, seedTeams, decided);
    const wins = { home: 0, away: 0 };
    if (home && away) {
      const key = pairKey(home, away);
      for (const game of games) {
        if (game.phase !== slot.phase || pairKey(game.homeTeamId, game.awayTeamId) !== key)
          continue;
        if (!game.isPlayed || game.homeScore === null || game.awayScore === null) continue;
        if (game.homeScore === game.awayScore) continue;
        const gameWinner = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
        if (gameWinner === home) wins.home += 1;
        else wins.away += 1;
      }
    }
    const needed = Math.ceil(slot.bestOf / 2);
    const winner = wins.home >= needed ? home : wins.away >= needed ? away : null;
    const complete = winner !== null;
    results[slot.id] = {
      slotId: slot.id,
      home,
      away,
      wins,
      complete,
      winner,
      score:
        complete && slot.bestOf > 1
          ? `${Math.max(wins.home, wins.away)}-${Math.min(wins.home, wins.away)}`
          : null,
    };
    decided.set(slot.id, { winner, participants: { home, away } });
  }
  return results;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Strict validation of an untrusted bracket submission; partial brackets are allowed. */
export function validateBracketAnswers(
  input: unknown,
  template: BracketTemplate,
  seeds: readonly BracketSeed[]
): BracketAnswers {
  if (!isObject(input)) throw new PredictionError('invalid', 'Las respuestas deben ser un objeto.');
  const slots = new Map(template.slots.map((slot) => [slot.id, slot]));
  for (const key of Object.keys(input))
    if (!slots.has(key)) throw new PredictionError('invalid', 'El cruce no es válido.');
  const answers: BracketAnswers = {};
  const winners: Record<string, string> = {};
  for (const slot of template.slots) {
    if (!Object.hasOwn(input, slot.id)) continue;
    const raw = input[slot.id];
    const invalid = () => new PredictionError('invalid', `Pronóstico inválido: ${slot.id}`);
    if (!isObject(raw) || typeof raw.winner !== 'string') throw invalid();
    const keys = Object.keys(raw);
    if (keys.some((key) => key !== 'winner' && key !== 'score')) throw invalid();
    const hasScore = Object.hasOwn(raw, 'score');
    if (
      hasScore &&
      (slot.bestOf <= 1 ||
        typeof raw.score !== 'string' ||
        !template.seriesScores.includes(raw.score))
    )
      throw invalid();
    // Participants come only from earlier validated picks, so a stale pick cannot slip through.
    const participants = resolveParticipants(template, seeds, winners)[slot.id];
    if (raw.winner !== participants.home && raw.winner !== participants.away) throw invalid();
    winners[slot.id] = raw.winner;
    answers[slot.id] = hasScore
      ? { winner: raw.winner, score: raw.score as string }
      : { winner: raw.winner };
  }
  return answers;
}

/** Drops picks whose winner is no longer a participant after an earlier pick changed. */
export function pruneInvalidPicks(
  template: BracketTemplate,
  seeds: readonly BracketSeed[],
  answers: BracketAnswers
): BracketAnswers {
  const kept: BracketAnswers = {};
  const winners: Record<string, string> = {};
  for (const slot of template.slots) {
    const pick = answers[slot.id];
    if (!pick) continue;
    const participants = resolveParticipants(template, seeds, winners)[slot.id];
    if (pick.winner !== participants.home && pick.winner !== participants.away) continue;
    winners[slot.id] = pick.winner;
    const scoreValid =
      pick.score !== undefined && slot.bestOf > 1 && template.seriesScores.includes(pick.score);
    kept[slot.id] = scoreValid
      ? { winner: pick.winner, score: pick.score }
      : { winner: pick.winner };
  }
  return kept;
}

export type SlotScoreStatus = 'pending' | 'correct' | 'wrong' | 'unpicked';

export interface SlotScore {
  status: SlotScoreStatus;
  points: number;
  bonus: number;
}

export interface BracketScore {
  points: number;
  /** True while any tie is still undecided. */
  provisional: boolean;
  slots: Record<string, SlotScore>;
}

/** Base points for the right winner, plus the series bonus when the exact series score also matches. */
export function scoreBracket(
  template: BracketTemplate,
  answers: BracketAnswers,
  results: Readonly<
    Record<string, Pick<BracketResult, 'complete' | 'winner' | 'score'> | undefined>
  >
): BracketScore {
  const slots: Record<string, SlotScore> = {};
  let points = 0;
  let provisional = false;
  for (const slot of template.slots) {
    const pick = answers[slot.id];
    const result = results[slot.id];
    if (!result?.complete) provisional = true;
    if (!pick) {
      slots[slot.id] = { status: 'unpicked', points: 0, bonus: 0 };
      continue;
    }
    if (!result?.complete) {
      slots[slot.id] = { status: 'pending', points: 0, bonus: 0 };
      continue;
    }
    const correct = pick.winner === result.winner;
    const bonus =
      correct && slot.bestOf > 1 && pick.score !== undefined && pick.score === result.score
        ? template.seriesScoreBonus
        : 0;
    const slotPoints = correct ? slot.points + bonus : 0;
    slots[slot.id] = { status: correct ? 'correct' : 'wrong', points: slotPoints, bonus };
    points += slotPoints;
  }
  return { points, provisional, slots };
}
