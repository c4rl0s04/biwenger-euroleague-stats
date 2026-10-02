import { PREDICTION_QUESTIONS, type PredictionAnswers, type PredictionQuestion } from './questions';
import type { SeasonPredictionOptions } from './options';

export type PredictionWindowStatus = 'not-open' | 'open' | 'locked';

export interface PredictionSubmissionView {
  answers: PredictionAnswers;
  revision: number;
  updatedAt: string;
}

export interface LeaguePredictionView {
  userId: string;
  name: string;
  image: string | null;
  answers: PredictionAnswers;
  updatedAt: string;
}

export interface SeasonPredictionsPageData {
  seasonId: string;
  status: PredictionWindowStatus;
  opensAt: string | null;
  locksAt: string | null;
  locksAtLabel: string | null;
  serverNow: string;
  questionSetVersion: string | null;
  questions: PredictionQuestion[];
  options: SeasonPredictionOptions;
  submission: PredictionSubmissionView | null;
  league: LeaguePredictionView[] | null;
}

export class PredictionError extends Error {
  constructor(
    public readonly code:
      | 'invalid'
      | 'not-member'
      | 'not-open'
      | 'locked'
      | 'conflict'
      | 'already-open'
      | 'empty-candidates',
    message: string
  ) {
    super(message);
    this.name = 'PredictionError';
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function validatePredictionAnswers(
  input: unknown,
  questions: readonly PredictionQuestion[],
  options: SeasonPredictionOptions
): PredictionAnswers {
  if (!isObject(input)) throw new PredictionError('invalid', 'Las respuestas deben ser un objeto.');
  const definitions = new Map(questions.map((question) => [question.id, question]));
  const answers: PredictionAnswers = {};
  for (const [id, rawAnswer] of Object.entries(input)) {
    const question = definitions.get(id);
    if (!question || !isObject(rawAnswer))
      throw new PredictionError('invalid', 'La pregunta no es válida.');
    const choices =
      question.section === 'player'
        ? options.players
        : question.section === 'team'
          ? options.teams
          : options.managers;
    const eligible = new Set(choices.map((choice) => choice.id));
    if (
      question.kind === 'single' &&
      rawAnswer.kind === 'single' &&
      typeof rawAnswer.id === 'string' &&
      eligible.has(rawAnswer.id) &&
      Object.keys(rawAnswer).length === 2
    ) {
      answers[id as keyof PredictionAnswers] = { kind: 'single', id: rawAnswer.id };
      continue;
    }
    if (
      question.kind === 'ranking' &&
      rawAnswer.kind === 'ranking' &&
      Array.isArray(rawAnswer.ids) &&
      Object.keys(rawAnswer).length === 2 &&
      rawAnswer.ids.length === choices.length &&
      rawAnswer.ids.every(
        (candidate) => typeof candidate === 'string' && eligible.has(candidate)
      ) &&
      new Set(rawAnswer.ids).size === choices.length
    ) {
      answers[id as keyof PredictionAnswers] = { kind: 'ranking', ids: [...rawAnswer.ids] };
      continue;
    }
    throw new PredictionError('invalid', `Respuesta inválida: ${question.prompt}`);
  }
  return answers;
}

export function validateCurrentAnswers(input: unknown, options: SeasonPredictionOptions) {
  return validatePredictionAnswers(input, PREDICTION_QUESTIONS, options);
}
