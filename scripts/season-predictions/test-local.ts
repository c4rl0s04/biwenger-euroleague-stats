import assert from 'node:assert/strict';
import { startDisposablePostgres } from '../db/disposable-postgres';
import { runMigrations } from '../db/migrate';

const disposable = await startDisposablePostgres();
try {
  await runMigrations(disposable.pool);
  process.env.DATABASE_URL = disposable.connectionString;
  process.env.SKIP_DB = 'false';
  const { pool } = await import('../../src/lib/db/client');
  const {
    readSeasonPredictions,
    saveSeasonPredictions,
    previewSeasonPredictionWindow,
    openSeasonPredictionWindow,
    previewPreseasonReopen,
    reopenPreseasonWindow,
    readPlayoffPredictions,
    previewPlayoffsWindow,
    openPlayoffsWindow,
  } = await import('../../src/features/season-predictions/server');
  const { PredictionError } =
    await import('../../src/features/season-predictions/models/submission');
  const expectCode = (code: string) => (error: unknown) =>
    error instanceof PredictionError && error.code === code;

  await disposable.pool.query(`
    INSERT INTO seasons (id, name, status) VALUES ('2026-27', '2026/27', 'active'), ('2027-28', '2027/28', 'frozen');
    INSERT INTO users (id, name) VALUES ('u1', 'Ana'), ('u2', 'Bruno'), ('outsider', 'Fuera');
    INSERT INTO user_seasons (season_id, user_id, name) VALUES
      ('2026-27', 'u1', 'Ana'), ('2026-27', 'u2', 'Bruno');
    INSERT INTO teams (id, name) VALUES (1, 'Zalgiris'), (2, 'Barcelona');
    INSERT INTO team_seasons (season_id, team_id) VALUES ('2026-27', 1), ('2026-27', 2);
    INSERT INTO players (id, name) VALUES (10, 'Zeta'), (11, 'Alfa');
    INSERT INTO player_seasons (season_id, player_id, team_id) VALUES
      ('2026-27', 10, 1), ('2026-27', 11, 2);
  `);

  assert.deepEqual(await previewSeasonPredictionWindow('2026-27'), {
    seasonId: '2026-27',
    alreadyOpen: false,
    players: 2,
    teams: 2,
    managers: 2,
    version: 'season-predictions-v1',
  });
  await assert.rejects(openSeasonPredictionWindow('2027-28'), expectCode('empty-candidates'));
  const before = await readSeasonPredictions('2026-27', 'u1');
  assert.equal(before.status, 'not-open');
  assert.equal(before.league, null);
  await assert.rejects(readSeasonPredictions('2026-27', 'outsider'), expectCode('not-member'));

  const opened = await openSeasonPredictionWindow('2026-27');
  assert.equal(Date.parse(opened.locksAt) - Date.parse(opened.opensAt), 168 * 60 * 60 * 1000);
  await assert.rejects(openSeasonPredictionWindow('2026-27'), expectCode('already-open'));
  const initial = await readSeasonPredictions('2026-27', 'u1');
  assert.equal(initial.status, 'open');
  assert.equal(initial.league, null);
  assert.deepEqual(
    initial.options.players.map((item) => item.name),
    ['Alfa', 'Zeta']
  );
  assert.deepEqual(
    initial.options.teams.map((item) => item.name),
    ['Barcelona', 'Zalgiris']
  );
  assert.deepEqual(
    initial.options.managers.map((item) => item.name),
    ['Ana', 'Bruno']
  );

  // Later roster changes must not alter candidate IDs or saved rankings.
  await disposable.pool.query(`INSERT INTO players (id, name) VALUES (12, 'Later');
    INSERT INTO player_seasons (season_id, player_id) VALUES ('2026-27', 12);`);
  assert.equal((await readSeasonPredictions('2026-27', 'u1')).options.players.length, 2);

  const partial = await saveSeasonPredictions({
    seasonId: '2026-27',
    userId: 'u1',
    revision: 0,
    answers: { 'player-total-points': { kind: 'single', id: '11' } },
  });
  assert.equal(partial.revision, 1);
  assert.equal((await readSeasonPredictions('2026-27', 'u2')).league, null);
  await assert.rejects(
    saveSeasonPredictions({ seasonId: '2026-27', userId: 'u1', revision: 0, answers: {} }),
    expectCode('conflict')
  );
  await assert.rejects(
    saveSeasonPredictions({ seasonId: '2026-27', userId: 'outsider', revision: 0, answers: {} }),
    expectCode('not-member')
  );
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 1,
      answers: { 'team-ranking': { kind: 'ranking', ids: ['1', '1'] } },
    }),
    expectCode('invalid')
  );
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 1,
      answers: { 'team-ranking': { kind: 'ranking', ids: ['1'] } },
    }),
    expectCode('invalid')
  );
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 1,
      answers: { 'team-ranking': { kind: 'ranking', ids: ['1', '999'] } },
    }),
    expectCode('invalid')
  );
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 1,
      answers: { 'unknown-question': { kind: 'single', id: '1' } },
    }),
    expectCode('invalid')
  );
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 1,
      answers: { 'player-total-points': { kind: 'single', id: '12' } },
    }),
    expectCode('invalid')
  );

  const full = await saveSeasonPredictions({
    seasonId: '2026-27',
    userId: 'u1',
    revision: 1,
    answers: {
      'player-total-points': { kind: 'single', id: '10' },
      'player-round-leader': { kind: 'single', id: '11' },
      'player-best-round': { kind: 'single', id: '10' },
      'player-underrated': { kind: 'single', id: '11' },
      'player-overrated': { kind: 'single', id: '10' },
      'team-ranking': { kind: 'ranking', ids: ['2', '1'] },
      'team-champion': { kind: 'single', id: '1' },
      'team-underrated': { kind: 'single', id: '2' },
      'team-overrated': { kind: 'single', id: '1' },
      'manager-ranking': { kind: 'ranking', ids: ['u2', 'u1'] },
      'manager-round-wins': { kind: 'single', id: 'u1' },
      'manager-best-round': { kind: 'single', id: 'u2' },
    },
  });
  assert.equal(Object.keys(full.answers).length, 12);
  const cleared = await saveSeasonPredictions({
    seasonId: '2026-27',
    userId: 'u1',
    revision: 2,
    answers: {},
  });
  assert.equal(cleared.revision, 3);
  assert.deepEqual((await readSeasonPredictions('2026-27', 'u1')).submission?.answers, {});
  await saveSeasonPredictions({
    seasonId: '2026-27',
    userId: 'u2',
    revision: 0,
    answers: { 'team-ranking': { kind: 'ranking', ids: ['1', '2'] } },
  });

  // Set the boundary using database time; a write at/after it must be rejected.
  await disposable.pool.query(`UPDATE season_prediction_windows SET locks_at = clock_timestamp()
    WHERE season_id = '2026-27'`);
  await assert.rejects(
    saveSeasonPredictions({ seasonId: '2026-27', userId: 'u1', revision: 3, answers: {} }),
    expectCode('locked')
  );
  const locked = await readSeasonPredictions('2026-27', 'u1');
  assert.equal(locked.status, 'locked');
  assert.deepEqual(
    locked.league?.map((member) => member.name),
    ['Ana', 'Bruno']
  );
  assert.deepEqual(locked.league?.[1].answers['team-ranking'], {
    kind: 'ranking',
    ids: ['1', '2'],
  });

  // A locked preseason window reopens exactly once and keeps submissions and revisions.
  await assert.rejects(previewPreseasonReopen('2026-27', 0), expectCode('invalid'));
  await assert.rejects(previewPreseasonReopen('2027-28', 24), expectCode('not-open'));
  const reopenPreview = await previewPreseasonReopen('2026-27', 24);
  assert.equal(reopenPreview.locked, true);
  assert.equal(reopenPreview.alreadyReopened, false);
  assert.equal(reopenPreview.submissions, 2);
  const reopened = await reopenPreseasonWindow('2026-27', 24);
  assert(new Date(reopened.locksAt) > new Date(reopened.reopenedAt));
  const afterReopen = await readSeasonPredictions('2026-27', 'u1');
  assert.equal(afterReopen.status, 'open');
  assert.equal(afterReopen.submission?.revision, 3);
  await assert.rejects(reopenPreseasonWindow('2026-27', 24), expectCode('already-open'));
  const resaved = await saveSeasonPredictions({
    seasonId: '2026-27',
    userId: 'u1',
    revision: 3,
    answers: {},
  });
  assert.equal(resaved.revision, 4);
  await disposable.pool.query(`UPDATE season_prediction_windows SET locks_at = clock_timestamp()
    WHERE season_id = '2026-27'`);
  await assert.rejects(reopenPreseasonWindow('2026-27', 24), expectCode('already-reopened'));

  // Windows and submissions are phase-scoped; a phase without a window rejects submissions.
  const phases = await disposable.pool.query(`SELECT phase FROM season_prediction_submissions
    WHERE season_id = '2026-27' GROUP BY phase`);
  assert.deepEqual(
    phases.rows.map((row) => row.phase),
    ['preseason']
  );
  await assert.rejects(
    disposable.pool
      .query(`INSERT INTO season_prediction_submissions (season_id, phase, user_id, answers)
      VALUES ('2026-27', 'playoffs', 'u1', '{}'::jsonb)`),
    /season_prediction_submissions_window_fk/
  );
  await assert.rejects(
    disposable.pool.query(`UPDATE season_prediction_windows SET phase = 'regular'
      WHERE season_id = '2026-27'`),
    /season_prediction_window_phase/
  );

  // Playoffs window: refused until the regular season is complete, then frozen and locked at the
  // first play-in tip-off.
  const codes = ['OLY', 'PAM', 'MAD', 'ULK', 'ZAL', 'HTA', 'PAN', 'MCO', 'BAR', 'RED', 'ASV'];
  const codeRows = `unnest(ARRAY[${codes.map((code) => `'${code}'`).join(',')}]) WITH ORDINALITY AS c(code, n)`;
  await disposable.pool.query(
    `INSERT INTO teams (id, name) SELECT 100 + n, 'Team ' || code
       FROM ${codeRows};
     INSERT INTO official_team_mappings
       (season_id, team_id, provider_team_code, provider_name, match_method)
     SELECT '2026-27', 100 + n, code, code, 'test' FROM ${codeRows};
     INSERT INTO official_team_standings (season_id, round_number, team_code, position)
     SELECT '2026-27', 38, code, n FROM ${codeRows};
     INSERT INTO official_schedule_games
       (season_id, game_code, phase_code, home_team_code, away_team_code, scheduled_at, is_played)
     VALUES ('2026-27', 380, 'RS', 'ZAL', 'ASV', clock_timestamp() - interval '1 day', FALSE)`
  );
  const notReady = await previewPlayoffsWindow('2026-27');
  assert.equal(notReady.ready, false);
  assert.equal(notReady.seeds.length, 10);
  assert.match(notReady.problems.join(' '), /fase regular no ha terminado/);
  assert.match(notReady.problems.join(' '), /play-in/);
  await assert.rejects(openPlayoffsWindow('2026-27'), expectCode('not-ready'));
  await disposable.pool.query(`UPDATE official_schedule_games SET is_played = TRUE
      WHERE season_id = '2026-27' AND game_code = 380;
    INSERT INTO official_schedule_games
      (season_id, game_code, phase_code, home_team_code, away_team_code, scheduled_at, is_played)
    VALUES ('2026-27', 381, 'PI', 'PAN', 'MCO', clock_timestamp() + interval '3 days', FALSE),
      ('2026-27', 382, 'PI', 'BAR', 'RED', clock_timestamp() + interval '2 days', FALSE)`);
  const ready = await previewPlayoffsWindow('2026-27');
  assert.deepEqual(ready.problems, []);
  assert.equal(ready.alreadyOpen, false);
  const playoffsOpened = await openPlayoffsWindow('2026-27');
  assert.equal(playoffsOpened.locksAt, ready.firstPlayInTipOff);
  await assert.rejects(openPlayoffsWindow('2026-27'), expectCode('already-open'));
  const bracket = await readPlayoffPredictions('2026-27', 'u1');
  assert.equal(bracket.status, 'open');
  assert.equal(bracket.template?.version, 'euroleague-v1');
  assert.deepEqual(
    bracket.seeds.map((entry) => entry.teamCode),
    codes.slice(0, 10)
  );
  const pan = bracket.seeds[6].teamId;
  const mad = bracket.seeds[2].teamId;

  const bracketSaved = await saveSeasonPredictions({
    seasonId: '2026-27',
    userId: 'u1',
    revision: 0,
    phase: 'playoffs',
    answers: { 'PI-1': { winner: pan }, 'QF-3': { winner: mad, score: '3-1' } },
  });
  assert.equal(bracketSaved.revision, 1);
  assert.equal((await readSeasonPredictions('2026-27', 'u1')).submission?.revision, 4);
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 1,
      phase: 'playoffs',
      answers: { 'QF-2': { winner: pan } },
    }),
    expectCode('invalid')
  );
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 0,
      phase: 'playoffs',
      answers: {},
    }),
    expectCode('conflict')
  );
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 1,
      phase: 'regular' as never,
      answers: {},
    }),
    expectCode('invalid')
  );
  // A play-in rescheduled before the window lock still locks the bracket at tip-off.
  await disposable.pool.query(`UPDATE official_schedule_games SET scheduled_at = clock_timestamp()
    WHERE season_id = '2026-27' AND game_code = 382`);
  await assert.rejects(
    saveSeasonPredictions({
      seasonId: '2026-27',
      userId: 'u1',
      revision: 1,
      phase: 'playoffs',
      answers: {},
    }),
    expectCode('locked')
  );
  const lockedBracket = await readPlayoffPredictions('2026-27', 'u2');
  assert.equal(lockedBracket.status, 'locked');
  assert.deepEqual(lockedBracket.league?.[0].answers['QF-3'], { winner: mad, score: '3-1' });
  assert.equal((await previewPlayoffsWindow('2026-27')).alreadyOpen, true);

  const tables = await disposable.pool.query(`SELECT relname, relrowsecurity FROM pg_class
    WHERE relname IN ('season_prediction_windows', 'season_prediction_submissions',
      'official_schedule_games')`);
  assert.equal(tables.rowCount, 3);
  assert(tables.rows.every((row) => row.relrowsecurity));
  const grants = await disposable.pool.query(`SELECT * FROM information_schema.role_table_grants
    WHERE table_name IN ('season_prediction_windows', 'season_prediction_submissions',
      'official_schedule_games')
      AND grantee IN ('anon', 'authenticated', 'service_role')`);
  assert.equal(grants.rowCount, 0);
  await pool.end();
  console.log('Season predictions disposable database checks passed.');
} finally {
  await disposable.cleanup();
}
