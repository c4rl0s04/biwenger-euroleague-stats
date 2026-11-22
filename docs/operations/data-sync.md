---
title: Data Sync Runbook
description: Safely preflight, run, verify, and recover synchronization jobs.
audience:
  - operator
  - maintainer
  - contributor
  - agent
status: active
---

# Data sync runbook

Synchronization writes provider data into PostgreSQL. It requires valid provider configuration, a
schema ready for the current code, and a writable season bound to the configured Biwenger league.

## Preflight

1. Confirm the database target without printing credentials.
2. Confirm the intended season and league values in local or deployment configuration.
3. Verify connectivity and schema readiness:

   ```bash
   npm run db:check
   npm run db:validate
   ```

4. For production or remote targets, confirm backups and follow [database safety](database-safety.md).
5. Ensure no scheduled/manual job is already active. The advisory lock will skip overlapping jobs,
   but job ownership should still be understood.

The CI scheduling configuration and runtime preflight tests provide additional protection against
accidentally enabling sync for a frozen season.

## Diagnose a failed scheduled run

1. Open the failed [Actions run](https://github.com/c4rl0s04/biwenger-euroleague-stats/actions).
   Record the workflow, commit, timestamp, mode, and first failed step. Use the job logs to
   distinguish a preflight rejection, an overlapping run, a provider failure, and a database error.
2. If the workflow has Sentry configured, look for an event at the matching time and commit.
   Compare the error and its cause with the job logs. A missing Sentry event does not establish
   success. The standalone sync client reports errors only when configured.
3. Before retrying, confirm the cause is corrected, the database and season still match the intended
   league, and no other run holds the sync lock. Keep credentials and raw provider responses out of
   investigation notes. For transient errors, repeat the original workflow after preflight. If
   recovery is scoped to one step, use its documented step selector and verify the affected data.
   For a failed guard or invalid provider payload, resolve the input or configuration first.

## Modes

| Command                                                     | Purpose                                                              |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm run sync`                                              | Routine ordered refresh.                                             |
| `npm run sync:bootstrap`                                    | Routine pipeline plus one-time initial squads and user colors.       |
| `npm run sync:live`                                         | Official data, live fantasy points and missing Biwenger lineups.     |
| `npm run sync:playoffs -- --season YYYY-YY`                 | Apply custom playoff metadata and results from checked-in JSON.      |
| `npm run sync:euroleague`                                   | Preview EuroLeague official website bio data & photoshoot portraits. |
| `npm run sync:euroleague:apply`                             | Commit EuroLeague official website photoshoot portraits & bio data.  |
| `npm run sync -- --step=match-linking`                      | Run one descriptive step for diagnosis or recovery.                  |
| `npm run sync -- --step=euroleague-games --force-game=CODE` | Reconcile one old finalized official game.                           |

For official EuroLeague website photoshoot scraping and bio enrichment, see the
[EuroLeague official website sync runbook](euroleague-website-sync.md).

The **Bootstrap Sync** GitHub Actions workflow exposes `sync:bootstrap` as a manual-only production
operation. It runs the full provider preflight before writing and has no scheduled trigger. Use it
once when initializing an active season, review the completed run, and only then enable the routine
**Scheduled Sync** workflow.

The declarative pipeline is:

| Order | Step ID                   | Source              | Main storage owned                                                     | Modes              |
| ----: | ------------------------- | ------------------- | ---------------------------------------------------------------------- | ------------------ |
|     1 | `biwenger-catalog`        | Biwenger            | `players`, `teams`, `player_seasons`                                   | routine, bootstrap |
|     2 | `biwenger-price-history`  | Biwenger            | `market_values`, namespaced `sync_meta` checkpoints                    | routine, bootstrap |
|     3 | `euroleague-master-data`  | EuroLeague          | `matches`, standings, team/player mappings                             | routine, bootstrap |
|     4 | `euroleague-postseason`   | EuroLeague          | `official_schedule_games` phases and postseason scores                 | all                |
|     5 | `match-linking`           | Biwenger + database | `matches` links and official sporting fields                           | routine, bootstrap |
|     6 | `biwenger-users`          | Biwenger            | `users`, `user_seasons`                                                | routine, bootstrap |
|     7 | `euroleague-games`        | EuroLeague          | game state, boxscores, events, shots, sporting round statistics        | all                |
|     8 | `biwenger-fantasy-points` | Biwenger            | only `player_round_stats.fantasy_points`                               | all                |
|     9 | `biwenger-lineups`        | Biwenger            | `lineups`, `user_rounds`                                               | all                |
|    10 | `biwenger-board`          | Biwenger            | transfers, bids, finances, and prediction pools in one pagination pass | routine, bootstrap |
|    11 | `biwenger-squads`         | Biwenger            | current `player_seasons.owner_id`                                      | routine, bootstrap |
|    12 | `biwenger-market`         | Biwenger            | current-day `market_listings` snapshot                                 | routine, bootstrap |
|    13 | `biwenger-tournaments`    | Biwenger            | tournaments, phases, fixtures, and standings                           | routine, bootstrap |
|    14 | `initial-squads`          | Database            | `initial_squads`                                                       | bootstrap          |
|    15 | `user-colors`             | Database            | `user_seasons.color_index`                                             | bootstrap          |

`euroleague-postseason` stores every official game with its phase (`RS`, `PI`, `PO`, `FF`) and
`round_code` set to the schedule group (for example `PLAYOFF A`), then fills final scores for played
non-RS games from the game report. An unknown phase code fails the step. It reuses the schedule
loaded by `euroleague-master-data` when both run, and fetches it otherwise (live mode).

Running a single step is an explicit recovery operation and does not automatically run its declared
dependencies. Check that prerequisite data is current first. Numeric `--step` values are rejected.

Before first activation, run `npm run db:production:check`, apply the additive readiness repair
through the [database safety](database-safety.md) runbook, and fingerprint `2025-26` with
`npm run db:season:fingerprint -- --season=2025-26`. Then create/activate `2026-27` and run
`npm run sync:preflight`. The active implementation has one official source and does not contain a
runtime provider selector. The removed implementation can be inspected from the
`archive/euroleague-legacy-2025-26` tag if historical diagnosis is required.

Use the [disposable database checks](../contributing/testing.md#browser-verification) for
schema and multi-season isolation. For a controlled production activation, use the
[season lifecycle runbook](season-lifecycle.md) and verify the frozen-season fingerprint.
The earlier two-pass live-provider test command has been retired.

## Daily player price history

The catalogue updates the latest `player_seasons.price` cache, but does not invent dated history
from its undated current-price snapshot. `biwenger-price-history` imports explicit Biwenger date/price
pairs for every player in the configured season, including existing identities and players no longer
listed in the catalogue. It inserts missing records, corrects differing prices, and leaves unchanged
rows and dates absent from the provider untouched. Late introductions and provider gaps are not
filled with synthetic values. History is bounded by season dates and the UTC date captured at run start.

Routine execution refreshes each player after 24 hours. Bootstrap checks everyone regardless of
freshness and invalidates those checkpoints before fetching, so interrupted forced refreshes remain
due for routine retry. Checkpoints use `biwenger-price-history:v1:<season>:<player>` keys in the existing
`sync_meta` table; changes to season boundaries invalidate freshness. Price writes and the checkpoint
commit atomically. Valid empty histories are counted separately and checked again after 24 hours;
malformed responses or failed writes never advance a checkpoint. Failed players are reported by ID;
the remaining due players are still attempted, then the step fails so the pipeline stops and exits nonzero.
Rerunning routine mode retains successful work and retries due players.

Two concurrent player reads preserve the provider client's request delays and rate-limit retries.
The step reports fetched/skipped players, inserted/corrected/unchanged prices, empty histories and
failures. Inspect its duration against the scheduled job's 30-minute total budget; do not change
provider pacing or workflow limits silently to mask overruns.

After the usual target, backup and writable-season checks, reconcile just prices (without running
bootstrap's initial-squad or other steps):

```bash
npm run sync:bootstrap -- --step=biwenger-price-history
```

Repeat that targeted command to verify zero inserts/corrections for unchanged provider history.
Routine recovery uses `npm run sync -- --step=biwenger-price-history` and respects checkpoints.
Never treat a populated latest date as proof that earlier dates are complete.

The dedicated SQL regression test starts its own disposable local PostgreSQL cluster, applies
committed migrations, and tests corrections, gap recovery, idempotency and atomic checkpoint failure:

```bash
RUN_PRICE_HISTORY_DB_TESTS=true SKIP_DB=true npm run test:run -- src/lib/sync/repositories/price-history.integration.test.ts
```

Implementation and check results are recorded in the
[market-value sync validation receipt](market-value-sync-validation.md).

## Execute and verify

Run the narrowest mode that satisfies the objective. The manager logs the resolved season, every
started/completed step, skips, and errors. A successful run clears the application memory cache,
releases its advisory lock, closes the connection, and exits successfully.

Afterward:

```bash
npm run db:check
```

Inspect representative application views and compare expected provider counts for the affected
domain. A zero exit code does not prove that the provider supplied every optional record.

## Failure and recovery

- If another worker owns the advisory lock, do not force it open; identify the active job and wait or
  stop that job safely.
- If season validation fails, correct configuration or use the season lifecycle. Never normalize a
  production frozen-season override.
- Every failure stops subsequent work. Fix the cause and rerun the pipeline or the affected step;
  writes are designed to be idempotent.
- Provider authentication errors require a valid token; rate or incomplete-data errors may require a
  later retry.

See [troubleshooting](troubleshooting.md) for symptom-oriented diagnosis and
[external API reference](../reference/external-apis/README.md) for provider boundaries.

## Fantasy-point refresh and recovery

Biwenger round reports (`/rounds/euroleague/{id}?score=1`) own fantasy scores;
EuroLeague sporting ingestion preserves them. Routine and bootstrap fantasy refreshes
include active/finished rounds and rounds with local matches that have started or start
within one hour. Future-only rounds are skipped. Routine refreshes retain historical
coverage to pick up corrections; bootstrap is available for explicit recovery.

Live refresh selects rounds with a local live match or a match scheduled between
24 hours ago and one hour ahead, including finished matches. This keeps the final
fantasy update eligible after official ingestion finishes a match. The existing live
workflow runs every five minutes during its configured Tuesday–Friday UTC window;
it is not a guarantee of round-the-clock coverage. Routine refreshes catch later corrections.

Each nonempty fantasy run validates the first competition round's dates against the
writable season before any fantasy writes, including single-step recovery. Numeric
integer scores (including zero and negatives) replace older values; absent/null scores
preserve known values. Invalid reports fail the round before any of its scores are written.
The summary reports selected/fetched rounds, reports, writes and missing scores. A completed
round without usable scores emits a warning. Idle live runs are quiet.

After releasing the fix, follow the database target/backup safeguards above, record
per-round coverage, and run only the fantasy step for the intended writable season:

```bash
npm run sync:bootstrap -- --step=biwenger-fantasy-points --season=2026-27
```

This does not run other bootstrap steps. It shares the pipeline advisory lock and refuses
frozen seasons. Compare stored scores with published Biwenger player reports per round,
including zero/negative examples; official-stat rows without a report may remain null.
Rerun to confirm safe repetition. Verify the standings draft cards after existing HTTP
caches expire (analytics may be cached for 15 minutes). Sync clears only its process-local
cache, not existing web-process or browser caches. Production writes require explicit
authorization; no deployment or repair is implied by local verification.
