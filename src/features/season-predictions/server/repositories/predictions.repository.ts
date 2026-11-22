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
  type LeaguePredictionView,
  type PlayoffsPageData,
  type PredictionSubmissionView,
  type SeasonPredictionsPageData,
} from '../../models/submission';
import {
  EUROLEAGUE_BRACKET_V1,
  validateBracketAnswers,
  type BracketAnswers,
  type BracketTemplate,
  type PlayoffSeed,
} from '../../models/bracket';
import {
  getSeasonPredictionCandidates,
  getSeasonPredictionTeamCrests,
} from '../queries/candidates.query';
import { getPostseasonReadiness, getPostseasonSeeds } from '../queries/postseason.query';
import { PREDICTION_PHASES, type PredictionPhase } from '../../models/phases';

const database = pool as Pool;
const PRESEASON: PredictionPhase = 'preseason';
const PLAYOFFS: PredictionPhase = 'playoffs';

interface PlayoffCandidates {
  seeds: PlayoffSeed[];
}

interface WindowRow {
  opens_at: Date;
  locks_at: Date;
  question_set_version: string;
  questions: PredictionQuestion[] | BracketTemplate;
  candidates: SeasonPredictionOptions | PlayoffCandidates;
}

// Playoff picks lock at the first play-in tip-off even if the schedule moves earlier than the
// window lock; LEAST ignores the NULL from an unscheduled play-in.
const WINDOW_SELECT = `SELECT w.opens_at,
    CASE WHEN w.phase = 'playoffs' THEN LEAST(w.locks_at, (
      SELECT MIN(g.scheduled_at) FROM official_schedule_games g
      WHERE g.season_id = w.season_id AND g.phase_code = 'PI'))
    ELSE w.locks_at END AS locks_at,
    w.question_set_version, w.questions, w.candidates
  FROM season_prediction_windows w WHERE w.season_id = $1 AND w.phase = $2`;

function assertPhase(phase: unknown): asserts phase is PredictionPhase {
  if (!PREDICTION_PHASES.includes(phase as PredictionPhase))
    throw new PredictionError('invalid', 'Fase de predicciones inválida.');
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

interface PhaseRead<Answers> {
  now: Date;
  window: WindowRow | undefined;
  locked: boolean;
  submission: PredictionSubmissionView<Answers> | null;
  league: LeaguePredictionView<Answers>[] | null;
}

async function readPhase<Answers>(
  seasonId: string,
  userId: string,
  phase: PredictionPhase
): Promise<PhaseRead<Answers>> {
  await assertMember(database, seasonId, userId);
  const nowResult = await database.query<{ now: Date }>('SELECT clock_timestamp() AS now');
  const now = nowResult.rows[0].now;
  const window = (await database.query<WindowRow>(WINDOW_SELECT, [seasonId, phase])).rows[0];
  if (!window || now < window.opens_at)
    return { now, window, locked: false, submission: null, league: null };
  const locked = now >= window.locks_at;
  const submissionResult = await database.query<{
    answers: Answers;
    revision: number;
    updated_at: Date;
  }>(
    `SELECT answers, revision, updated_at FROM season_prediction_submissions
     WHERE season_id = $1 AND phase = $2 AND user_id = $3`,
    [seasonId, phase, userId]
  );
  const own = submissionResult.rows[0];
  const league = locked
    ? (
        await database.query<{
          user_id: string;
          name: string;
          icon: string | null;
          answers: Answers;
          updated_at: Date;
        }>(
          `SELECT s.user_id, u.name, u.icon, s.answers, s.updated_at
     FROM season_prediction_submissions s JOIN user_seasons u
       ON u.season_id = s.season_id AND u.user_id = s.user_id
     WHERE s.season_id = $1 AND s.phase = $2 ORDER BY u.name, s.user_id`,
          [seasonId, phase]
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
    now,
    window,
    locked,
    submission: own
      ? { answers: own.answers, revision: own.revision, updatedAt: own.updated_at.toISOString() }
      : null,
    league,
  };
}

export async function readSeasonPredictions(
  seasonId: string,
  userId: string
): Promise<SeasonPredictionsPageData> {
  const { now, window, locked, submission, league } = await readPhase<PredictionAnswers>(
    seasonId,
    userId,
    PRESEASON
  );
  const questions = window?.questions as PredictionQuestion[] | undefined;
  if (!window || now < window.opens_at) {
    return {
      seasonId,
      status: 'not-open',
      opensAt: window?.opens_at.toISOString() ?? null,
      locksAt: window?.locks_at.toISOString() ?? null,
      locksAtLabel: lockLabel(window?.locks_at),
      serverNow: now.toISOString(),
      questionSetVersion: window?.question_set_version ?? null,
      questions: questions ?? [...PREDICTION_QUESTIONS],
      sections: sectionsForQuestionSet(
        window?.question_set_version ?? null,
        questions ?? PREDICTION_QUESTIONS
      ),
      options: emptyOptions(),
      submission: null,
      league: null,
    };
  }
  const candidates = window.candidates as SeasonPredictionOptions;
  const teamCrests = await getSeasonPredictionTeamCrests(
    seasonId,
    candidates.teams.map((team) => team.id)
  );
  return {
    seasonId,
    status: locked ? 'locked' : 'open',
    opensAt: window.opens_at.toISOString(),
    locksAt: window.locks_at.toISOString(),
    locksAtLabel: lockLabel(window.locks_at),
    serverNow: now.toISOString(),
    questionSetVersion: window.question_set_version,
    questions: questions!,
    sections: sectionsForQuestionSet(window.question_set_version, questions!),
    options: withTeamCrests(candidates, teamCrests),
    submission,
    league,
  };
}

export async function readPlayoffPredictions(
  seasonId: string,
  userId: string
): Promise<PlayoffsPageData> {
  const { now, window, locked, submission, league } = await readPhase<BracketAnswers>(
    seasonId,
    userId,
    PLAYOFFS
  );
  const open = Boolean(window && now >= window.opens_at);
  return {
    seasonId,
    status: !open ? 'not-open' : locked ? 'locked' : 'open',
    opensAt: window?.opens_at.toISOString() ?? null,
    locksAt: window?.locks_at.toISOString() ?? null,
    locksAtLabel: lockLabel(window?.locks_at),
    serverNow: now.toISOString(),
    template: open ? (window!.questions as BracketTemplate) : null,
    seeds: open ? (window!.candidates as PlayoffCandidates).seeds : [],
    submission,
    league,
  };
}

export async function saveSeasonPredictions(input: {
  seasonId: string;
  userId: string;
  revision: number;
  answers: unknown;
  phase?: PredictionPhase;
}): Promise<{
  answers: PredictionAnswers | BracketAnswers;
  revision: number;
  updatedAt: string;
}> {
  const phase = input.phase ?? PRESEASON;
  assertPhase(phase);
  const client = await database.connect();
  try {
    await client.query('BEGIN');
    await assertMember(client, input.seasonId, input.userId);
    // Serializes saves against this window and rechecks the database clock after waiting.
    const windowResult = await client.query<WindowRow>(`${WINDOW_SELECT} FOR UPDATE OF w`, [
      input.seasonId,
      phase,
    ]);
    const window = windowResult.rows[0];
    if (!window) throw new PredictionError('not-open', 'Las predicciones aún no están abiertas.');
    const now = (await client.query<{ now: Date }>('SELECT clock_timestamp() AS now')).rows[0].now;
    if (now < window.opens_at)
      throw new PredictionError('not-open', 'Las predicciones aún no están abiertas.');
    if (now >= window.locks_at)
      throw new PredictionError('locked', 'El plazo de predicciones ha terminado.');
    if (!Number.isSafeInteger(input.revision) || input.revision < 0)
      throw new PredictionError('invalid', 'Revisión inválida.');
    const answers =
      phase === PLAYOFFS
        ? validateBracketAnswers(
            input.answers,
            window.questions as BracketTemplate,
            (window.candidates as PlayoffCandidates).seeds
          )
        : validatePredictionAnswers(
            input.answers,
            window.questions as PredictionQuestion[],
            window.candidates as SeasonPredictionOptions
          );
    const previous = await client.query<{ revision: number }>(
      `SELECT revision FROM season_prediction_submissions
       WHERE season_id = $1 AND phase = $2 AND user_id = $3 FOR UPDATE`,
      [input.seasonId, phase, input.userId]
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
      [input.seasonId, phase, input.userId, JSON.stringify(answers)]
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

async function inspectPlayoffsWindow(seasonId: string, connection: Pool | PoolClient) {
  const template = EUROLEAGUE_BRACKET_V1;
  const season = await connection.query('SELECT id FROM seasons WHERE id = $1', [seasonId]);
  if (!season.rowCount) throw new PredictionError('invalid', 'Temporada desconocida.');
  const existing = await connection.query(
    'SELECT 1 FROM season_prediction_windows WHERE season_id = $1 AND phase = $2',
    [seasonId, PLAYOFFS]
  );
  const readiness = await getPostseasonReadiness(seasonId, connection);
  const seedRows = await getPostseasonSeeds(seasonId, template.seedCount, connection);
  const problems: string[] = [];
  if (!readiness.regularSeasonGames || readiness.regularSeasonUnplayed)
    problems.push(
      `La fase regular no ha terminado (${readiness.regularSeasonUnplayed} de ${readiness.regularSeasonGames} partidos sin jugar).`
    );
  const positions = new Set(seedRows.map((row) => row.seed));
  const missingSeeds = Array.from({ length: template.seedCount }, (_, index) => index + 1).filter(
    (position) => !positions.has(position)
  );
  if (missingSeeds.length) problems.push(`Faltan cabezas de serie: ${missingSeeds.join(', ')}.`);
  const unmappedTeamCodes = seedRows.filter((row) => !row.teamId).map((row) => row.teamCode);
  if (unmappedTeamCodes.length)
    problems.push(`Equipos sin mapear: ${unmappedTeamCodes.join(', ')}.`);
  const tipOff = readiness.firstPlayInTipOff;
  if (!readiness.playInGames || !tipOff)
    problems.push('El calendario no tiene partidos de play-in con fecha.');
  else if (readiness.playInPlayed || tipOff <= readiness.now)
    problems.push('El play-in ya ha empezado.');
  const seeds: PlayoffSeed[] = seedRows
    .filter((row) => row.teamId)
    .map((row) => ({
      seed: row.seed,
      teamId: row.teamId!,
      teamCode: row.teamCode,
      name: row.name,
      image: row.image,
    }));
  return {
    seasonId,
    version: template.version,
    alreadyOpen: Boolean(existing.rowCount),
    ready: problems.length === 0,
    problems,
    seeds,
    unmappedTeamCodes,
    firstPlayInTipOff: tipOff?.toISOString() ?? null,
  };
}

/** Read-only check of the facts the playoffs window needs before it can open. */
export async function previewPlayoffsWindow(seasonId: string) {
  return inspectPlayoffsWindow(seasonId, database);
}

/**
 * Opens the playoffs window once the regular season is complete, seeds 1-10 are mapped and the
 * play-in has not started. The window freezes the bracket template and the seeds, and locks at
 * the first play-in tip-off.
 */
export async function openPlayoffsWindow(seasonId: string) {
  const client = await database.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');
    const inspection = await inspectPlayoffsWindow(seasonId, client);
    if (inspection.alreadyOpen)
      throw new PredictionError('already-open', 'La ventana ya se abrió.');
    if (!inspection.ready) throw new PredictionError('not-ready', inspection.problems.join(' '));
    const result = await client.query<{ opens_at: Date; locks_at: Date }>(
      `INSERT INTO season_prediction_windows
         (season_id, phase, opens_at, locks_at, question_set_version, questions, candidates)
       VALUES ($1, $2, clock_timestamp(), $3, $4, $5::jsonb, $6::jsonb)
       RETURNING opens_at, locks_at`,
      [
        seasonId,
        PLAYOFFS,
        inspection.firstPlayInTipOff,
        EUROLEAGUE_BRACKET_V1.version,
        JSON.stringify(EUROLEAGUE_BRACKET_V1),
        JSON.stringify({ seeds: inspection.seeds } satisfies PlayoffCandidates),
      ]
    );
    await client.query('COMMIT');
    return {
      seasonId,
      opensAt: result.rows[0].opens_at.toISOString(),
      locksAt: result.rows[0].locks_at.toISOString(),
      seeds: inspection.seeds.length,
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
