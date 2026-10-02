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

  const tables = await disposable.pool.query(`SELECT relname, relrowsecurity FROM pg_class
    WHERE relname IN ('season_prediction_windows', 'season_prediction_submissions')`);
  assert.equal(tables.rowCount, 2);
  assert(tables.rows.every((row) => row.relrowsecurity));
  const grants = await disposable.pool.query(`SELECT * FROM information_schema.role_table_grants
    WHERE table_name IN ('season_prediction_windows', 'season_prediction_submissions')
      AND grantee IN ('anon', 'authenticated', 'service_role')`);
  assert.equal(grants.rowCount, 0);
  await pool.end();
  console.log('Season predictions disposable database checks passed.');
} finally {
  await disposable.cleanup();
}
