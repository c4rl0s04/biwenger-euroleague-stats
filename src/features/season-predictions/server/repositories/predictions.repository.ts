import 'server-only';

import type { Pool, PoolClient } from 'pg';
import { pool } from '@/lib/db/client';
import {
  PREDICTION_QUESTIONS,
  QUESTION_SET_VERSION,
  sectionsForQuestionSet,
  type PredictionAnswers,
  type PredictionQuestion,
} from '../../models/questions';
import { withTeamCrests, type SeasonPredictionOptions } from '../../models/options';
import {
  PredictionError,
  validatePredictionAnswers,
  type SeasonPredictionsPageData,
} from '../../models/submission';
import {
  getSeasonPredictionCandidates,
  getSeasonPredictionTeamCrests,
} from '../queries/candidates.query';
import type { PredictionPhase } from '../../models/phases';

const database = pool as Pool;
// Only the preseason questionnaire is served until the playoff bracket phase lands.
const PRESEASON: PredictionPhase = 'preseason';

interface WindowRow {
  opens_at: Date;
  locks_at: Date;
  question_set_version: string;
  questions: PredictionQuestion[];
  candidates: SeasonPredictionOptions;
}

export const SEASON_PREDICTIONS_POLICY = Object.freeze({
  access: 'authenticated member of the selected season',
  freshness: 'uncached, database clock controls visibility and writes',
  leagueVisibility: 'same-season submissions only at or after the lock',
} as const);

async function assertMember(connection: Pool | PoolClient, seasonId: string, userId: string) {
  const result = await connection.query(
    `SELECT 1 FROM user_seasons WHERE season_id = $1 AND user_id = $2 AND status = 'active'`,
    [seasonId, userId]
  );
  if (!result.rowCount) throw new PredictionError('not-member', 'No perteneces a esta temporada.');
}

function emptyOptions(): SeasonPredictionOptions {
  return { players: [], teams: [], managers: [] };
}
function lockLabel(date: Date | undefined) {
  return date
    ? new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'Europe/Madrid',
      }).format(date)
    : null;
}

export async function readSeasonPredictions(
  seasonId: string,
  userId: string
): Promise<SeasonPredictionsPageData> {
  await assertMember(database, seasonId, userId);
  const nowResult = await database.query<{ now: Date }>('SELECT clock_timestamp() AS now');
  const now = nowResult.rows[0].now;
  const windowResult = await database.query<WindowRow>(
    `SELECT opens_at, locks_at, question_set_version, questions, candidates
     FROM season_prediction_windows WHERE season_id = $1 AND phase = $2`,
    [seasonId, PRESEASON]
  );
  const window = windowResult.rows[0];
  if (!window || now < window.opens_at) {
    return {
      seasonId,
      status: 'not-open',
      opensAt: window?.opens_at.toISOString() ?? null,
      locksAt: window?.locks_at.toISOString() ?? null,
      locksAtLabel: lockLabel(window?.locks_at),
      serverNow: now.toISOString(),
      questionSetVersion: window?.question_set_version ?? null,
      questions: window?.questions ?? [...PREDICTION_QUESTIONS],
      sections: sectionsForQuestionSet(
        window?.question_set_version ?? null,
        window?.questions ?? PREDICTION_QUESTIONS
      ),
      options: emptyOptions(),
      submission: null,
      league: null,
    };
  }
  const locked = now >= window.locks_at;
  const teamCrests = await getSeasonPredictionTeamCrests(
    seasonId,
    window.candidates.teams.map((team) => team.id)
  );
  const submissionResult = await database.query<{
    answers: PredictionAnswers;
    revision: number;
    updated_at: Date;
  }>(
    `SELECT answers, revision, updated_at FROM season_prediction_submissions
     WHERE season_id = $1 AND phase = $2 AND user_id = $3`,
    [seasonId, PRESEASON, userId]
  );
  const own = submissionResult.rows[0];
  const league = locked
    ? (
        await database.query<{
          user_id: string;
          name: string;
          icon: string | null;
          answers: PredictionAnswers;
          updated_at: Date;
        }>(
          `SELECT s.user_id, u.name, u.icon, s.answers, s.updated_at
     FROM season_prediction_submissions s JOIN user_seasons u
       ON u.season_id = s.season_id AND u.user_id = s.user_id
     WHERE s.season_id = $1 AND s.phase = $2 ORDER BY u.name, s.user_id`,
          [seasonId, PRESEASON]
        )
      ).rows.map((row) => ({
        userId: row.user_id,
        name: row.name,
        image: row.icon,
        answers: row.answers,
        updatedAt: row.updated_at.toISOString(),
      }))
    : null;
  return {
    seasonId,
    status: locked ? 'locked' : 'open',
    opensAt: window.opens_at.toISOString(),
    locksAt: window.locks_at.toISOString(),
    locksAtLabel: lockLabel(window.locks_at),
    serverNow: now.toISOString(),
    questionSetVersion: window.question_set_version,
    questions: window.questions,
    sections: sectionsForQuestionSet(window.question_set_version, window.questions),
    options: withTeamCrests(window.candidates, teamCrests),
    submission: own
      ? { answers: own.answers, revision: own.revision, updatedAt: own.updated_at.toISOString() }
      : null,
    league,
  };
}

export async function saveSeasonPredictions(input: {
  seasonId: string;
  userId: string;
  revision: number;
  answers: unknown;
}) {
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    await assertMember(client, input.seasonId, input.userId);
    // Serializes saves against this window and rechecks the database clock after waiting.
    const windowResult = await client.query<WindowRow>(
      `SELECT opens_at, locks_at, question_set_version, questions, candidates
       FROM season_prediction_windows WHERE season_id = $1 AND phase = $2 FOR UPDATE`,
      [input.seasonId, PRESEASON]
    );
    const window = windowResult.rows[0];
    if (!window) throw new PredictionError('not-open', 'Las predicciones aún no están abiertas.');
    const now = (await client.query<{ now: Date }>('SELECT clock_timestamp() AS now')).rows[0].now;
    if (now < window.opens_at)
      throw new PredictionError('not-open', 'Las predicciones aún no están abiertas.');
    if (now >= window.locks_at)
      throw new PredictionError('locked', 'El plazo de predicciones ha terminado.');
    if (!Number.isSafeInteger(input.revision) || input.revision < 0)
      throw new PredictionError('invalid', 'Revisión inválida.');
    const answers = validatePredictionAnswers(input.answers, window.questions, window.candidates);
    const previous = await client.query<{ revision: number }>(
      `SELECT revision FROM season_prediction_submissions
       WHERE season_id = $1 AND phase = $2 AND user_id = $3 FOR UPDATE`,
      [input.seasonId, PRESEASON, input.userId]
    );
    const actualRevision = previous.rows[0]?.revision ?? 0;
    if (input.revision !== actualRevision)
      throw new PredictionError(
        'conflict',
        'Tus predicciones se modificaron en otra pestaña. Recarga la página.'
      );
    const result = await client.query<{ revision: number; updated_at: Date }>(
      `INSERT INTO season_prediction_submissions (season_id, phase, user_id, answers, revision)
       VALUES ($1, $2, $3, $4::jsonb, 1)
       ON CONFLICT (season_id, phase, user_id) DO UPDATE SET answers = EXCLUDED.answers,
         revision = season_prediction_submissions.revision + 1,
         updated_at = clock_timestamp()
       RETURNING revision, updated_at`,
      [input.seasonId, PRESEASON, input.userId, JSON.stringify(answers)]
    );
    await client.query('COMMIT');
    return {
      answers,
      revision: result.rows[0].revision,
      updatedAt: result.rows[0].updated_at.toISOString(),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function previewSeasonPredictionWindow(seasonId: string) {
  const season = await database.query('SELECT id FROM seasons WHERE id = $1', [seasonId]);
  if (!season.rowCount) throw new PredictionError('invalid', 'Temporada desconocida.');
  const existing = await database.query(
    'SELECT 1 FROM season_prediction_windows WHERE season_id = $1 AND phase = $2',
    [seasonId, PRESEASON]
  );
  const candidates = await getSeasonPredictionCandidates(seasonId);
  return {
    seasonId,
    alreadyOpen: Boolean(existing.rowCount),
    players: candidates.players.length,
    teams: candidates.teams.length,
    managers: candidates.managers.length,
    version: QUESTION_SET_VERSION,
  };
}

export async function openSeasonPredictionWindow(seasonId: string) {
  const client = await database.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    const season = await client.query('SELECT id FROM seasons WHERE id = $1', [seasonId]);
    if (!season.rowCount) throw new PredictionError('invalid', 'Temporada desconocida.');
    const existing = await client.query(
      'SELECT 1 FROM season_prediction_windows WHERE season_id = $1 AND phase = $2',
      [seasonId, PRESEASON]
    );
    if (existing.rowCount) throw new PredictionError('already-open', 'La ventana ya se abrió.');
    const candidates = await getSeasonPredictionCandidates(seasonId, client);
    if (!candidates.players.length || !candidates.teams.length || !candidates.managers.length)
      throw new PredictionError(
        'empty-candidates',
        'Hay una lista de candidatos obligatoria vacía.'
      );
    const result = await client.query<{ opens_at: Date; locks_at: Date }>(
      `WITH opened AS (SELECT clock_timestamp() AS at)
       INSERT INTO season_prediction_windows
         (season_id, phase, opens_at, locks_at, question_set_version, questions, candidates)
       SELECT $1, $2, opened.at, opened.at + interval '168 hours', $3, $4::jsonb, $5::jsonb FROM opened
       RETURNING opens_at, locks_at`,
      [
        seasonId,
        PRESEASON,
        QUESTION_SET_VERSION,
        JSON.stringify(PREDICTION_QUESTIONS),
        JSON.stringify(candidates),
      ]
    );
    await client.query('COMMIT');
    return {
      seasonId,
      opensAt: result.rows[0].opens_at.toISOString(),
      locksAt: result.rows[0].locks_at.toISOString(),
      candidates: {
        players: candidates.players.length,
        teams: candidates.teams.length,
        managers: candidates.managers.length,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error && 'code' in error && error.code === '23505')
      throw new PredictionError('already-open', 'La ventana ya se abrió.');
    throw error;
  } finally {
    client.release();
  }
}

// A locked preseason window may be reopened exactly once, keeping its frozen questions,
// candidates and every existing submission and revision.
const MAX_REOPEN_HOURS = 336;

function assertReopenHours(hours: number) {
  if (!Number.isInteger(hours) || hours < 1 || hours > MAX_REOPEN_HOURS)
    throw new PredictionError(
      'invalid',
      `Las horas deben ser un entero entre 1 y ${MAX_REOPEN_HOURS}.`
    );
}

export async function previewPreseasonReopen(seasonId: string, hours: number) {
  assertReopenHours(hours);
  const result = await database.query<{
    locks_at: Date;
    reopened_at: Date | null;
    now: Date;
    submissions: number;
  }>(
    `SELECT w.locks_at, w.reopened_at, clock_timestamp() AS now,
       (SELECT count(*)::int FROM season_prediction_submissions s
        WHERE s.season_id = w.season_id AND s.phase = w.phase) AS submissions
     FROM season_prediction_windows w WHERE w.season_id = $1 AND w.phase = $2`,
    [seasonId, PRESEASON]
  );
  const window = result.rows[0];
  if (!window)
    throw new PredictionError('not-open', 'Esta temporada no tiene ventana de pretemporada.');
  return {
    seasonId,
    currentLocksAt: window.locks_at.toISOString(),
    locked: window.now >= window.locks_at,
    alreadyReopened: window.reopened_at !== null,
    submissions: window.submissions,
    newLocksAt: new Date(window.now.getTime() + hours * 3_600_000).toISOString(),
  };
}

export async function reopenPreseasonWindow(seasonId: string, hours: number) {
  assertReopenHours(hours);
  const result = await database.query<{ locks_at: Date; reopened_at: Date }>(
    `UPDATE season_prediction_windows
     SET locks_at = clock_timestamp() + make_interval(hours => $3), reopened_at = clock_timestamp()
     WHERE season_id = $1 AND phase = $2 AND reopened_at IS NULL AND locks_at <= clock_timestamp()
     RETURNING locks_at, reopened_at`,
    [seasonId, PRESEASON, hours]
  );
  const reopened = result.rows[0];
  if (reopened)
    return {
      seasonId,
      locksAt: reopened.locks_at.toISOString(),
      reopenedAt: reopened.reopened_at.toISOString(),
    };
  const preview = await previewPreseasonReopen(seasonId, hours);
  if (!preview.locked) throw new PredictionError('already-open', 'La ventana sigue abierta.');
  throw new PredictionError('already-reopened', 'La ventana ya se reabrió una vez.');
}
