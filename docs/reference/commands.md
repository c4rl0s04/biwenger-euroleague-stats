---
title: Command Reference
description: Supported npm commands for development, sync, tests, database work, and analysis.
audience:
  - newcomer
  - contributor
  - maintainer
  - operator
  - agent
status: active
---

# Command reference

`package.json` is the source of truth. Run commands from the repository root.

## Application and quality

| Command              | Behavior                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Start Next.js development with Turbopack.                                                               |
| `npm run build`      | Create the production Next.js build. Set `SKIP_DB=true` when intentionally building without PostgreSQL. |
| `npm run start`      | Serve an existing production build.                                                                     |
| `npm run lint`       | Run ESLint.                                                                                             |
| `npm run typecheck`  | Run TypeScript without emitting files.                                                                  |
| `npm run format`     | Rewrite files under `src/` with Prettier.                                                               |
| `npm run docs:check` | Check maintained Markdown metadata, formatting, and local links.                                        |
| `npm run analyze`    | Build with the Next.js bundle analyzer and webpack.                                                     |

## Setup and synchronization

| Command                                    | Behavior                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| `npm run setup`                            | Interactive local environment setup.                                             |
| `npm run sync`                             | Routine guarded synchronization pipeline.                                        |
| `npm run sync:bootstrap`                   | Routine pipeline plus bootstrap-only derived data.                               |
| `npm run sync:live`                        | Official game data and missing-lineup synchronization.                           |
| `npm run sync:preflight`                   | Validate configuration and workflow readiness without running the main pipeline. |
| `npm run sync:playoffs`                    | Apply checked-in custom playoff data.                                            |
| `npm run sync:official:mappings -- report` | Print season-scoped official mappings and pending reviews.                       |

Use descriptive step IDs for targeted recovery, for example
`npm run sync -- --step=biwenger-market`. Only
`--step=euroleague-games` accepts `--force-game=<positive game code>`.

Manual mappings use `assign-team --code=XXX --team-id=N` or
`assign-player --code=P000000 --player-id=N`. The command accepts only the configured active season;
player assignment rematerializes only that player's active-season rows.

See the [data sync runbook](../operations/data-sync.md) before running a mutating sync.

## Tests

| Command                             | Behavior                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `npm test`                          | Start Vitest in its normal interactive/watch behavior.                         |
| `npm run test:run`                  | Run the full Vitest suite once.                                                |
| `npm run test:official-integration` | Run two full syncs against an explicitly disposable local PostgreSQL database. |

Use a focused Vitest path or name filter during development, then run the complete suite before
integration. Database-backed tests require the explicit safety configuration described in
[testing](../contributing/testing.md).

## Database and seasons

| Command                            | Behavior                                                                     |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `npm run db:check`                 | Inspect basic application database state.                                    |
| `npm run db:verify`                | Verify the PostgreSQL connection.                                            |
| `npm run db:verify:drizzle`        | Verify the Drizzle client over the configured connection.                    |
| `npm run db:audit:schema`          | Compare runtime database state with schema expectations.                     |
| `npm run db:audit:schema:metadata` | Compare source schema with committed metadata without a DB connection.       |
| `npm run db:production:check`      | Audit production migration, constraint, index, FK, RLS, and grant readiness. |
| `npm run db:production:apply`      | Apply the guarded additive repair after backup confirmation.                 |
| `npm run db:season:audit`          | Read-only multi-season integrity audit.                                      |
| `npm run db:season:fingerprint`    | Emit deterministic row counts and hashes for a season (defaults to 2025-26). |
| `npm run db:season:freeze`         | Freeze a season after explicit backup confirmation.                          |
| `npm run db:season:create-next`    | Create the next season after explicit backup confirmation.                   |
| `npm run db:repair:player-prices`  | Dry-run price-cache drift; add `-- --apply` only through the safety runbook. |

Database commands can target remote state through environment configuration. Follow
[database safety](../operations/database-safety.md) and [season lifecycle](../operations/season-lifecycle.md).
