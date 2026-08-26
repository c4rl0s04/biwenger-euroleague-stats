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
   npm run db:verify
   npm run db:verify:drizzle
   npm run db:check
   ```

4. For production or remote targets, confirm backups and follow [database safety](database-safety.md).
5. Ensure no scheduled/manual job is already active. The advisory lock will skip overlapping jobs,
   but job ownership should still be understood.

The CI scheduling configuration and runtime preflight tests provide additional protection against
accidentally enabling sync for a frozen season.

## Modes

| Command                                                     | Purpose                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| `npm run sync`                                              | Routine ordered refresh.                                        |
| `npm run sync:bootstrap`                                    | Routine pipeline plus one-time initial squads and user colors.  |
| `npm run sync:live`                                         | Official game data and missing Biwenger lineups only.           |
| `npm run sync:playoffs`                                     | Apply custom playoff metadata and results from checked-in JSON. |
| `npm run sync -- --step=match-linking`                      | Run one descriptive step for diagnosis or recovery.             |
| `npm run sync -- --step=euroleague-games --force-game=CODE` | Reconcile one old finalized official game.                      |
| `npm run sync:official:mappings -- report`                  | Print the reproducible season mapping report.                   |

The declarative pipeline is:

| Order | Step ID                   | Source              | Main storage owned                                                     | Modes              |
| ----: | ------------------------- | ------------------- | ---------------------------------------------------------------------- | ------------------ |
|     1 | `biwenger-catalog`        | Biwenger            | `players`, `teams`, `player_seasons`, `market_values`                  | routine, bootstrap |
|     2 | `euroleague-master-data`  | EuroLeague          | `official_games`, standings, team/player mappings                      | routine, bootstrap |
|     3 | `match-linking`           | Biwenger + database | `matches` links and official sporting fields                           | routine, bootstrap |
|     4 | `biwenger-users`          | Biwenger            | `users`, `user_seasons`                                                | routine, bootstrap |
|     5 | `euroleague-games`        | EuroLeague          | game state, boxscores, events, shots, sporting round statistics        | all                |
|     6 | `biwenger-fantasy-points` | Biwenger            | only `player_round_stats.fantasy_points`                               | routine, bootstrap |
|     7 | `biwenger-lineups`        | Biwenger            | `lineups`, `user_rounds`                                               | all                |
|     8 | `biwenger-board`          | Biwenger            | transfers, bids, finances, and prediction pools in one pagination pass | routine, bootstrap |
|     9 | `biwenger-squads`         | Biwenger            | current `player_seasons.owner_id`                                      | routine, bootstrap |
|    10 | `biwenger-market`         | Biwenger            | current-day `market_listings` snapshot                                 | routine, bootstrap |
|    11 | `biwenger-tournaments`    | Biwenger            | tournaments, phases, fixtures, and standings                           | routine, bootstrap |
|    12 | `initial-squads`          | Database            | `initial_squads`                                                       | bootstrap          |
|    13 | `user-colors`             | Database            | `user_seasons.color_index`                                             | bootstrap          |

Running a single step is an explicit recovery operation and does not automatically run its declared
dependencies. Check that prerequisite data is current first. Numeric `--step` values are rejected.

Before first activation, apply additive migrations `0007` and `0008`, freeze and fingerprint `2025-26` with
`npm run db:season:fingerprint -- --season=2025-26`, create/activate
`2026-27`, and run `npm run sync:preflight`. The active implementation has one official source and
does not contain a runtime provider selector. The removed implementation can be inspected from the
`archive/euroleague-legacy-2025-26` tag if historical diagnosis is required.

Before production, run the two-pass isolation harness against a migrated local database whose name
contains `test` or `disposable`:

```bash
RUN_DB_TESTS=true TEST_DATABASE_URL=postgresql://.../biwenger_disposable \
  npm run test:official-integration
```

It verifies stable canonical row counts, a frozen `2025-26` fingerprint, unchanged historical
global identities, and absence of official writes outside the active season.

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
