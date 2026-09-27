---
title: Task 22 — Infrastructure and cache lifecycle
description: Retained infrastructure ownership, lock cleanup, cache contracts, and validation evidence.
audience:
  - maintainer
  - contributor
  - operator
status: active
---

# Task 22 — Infrastructure and cache lifecycle

Implementation date: 2026-09-27. Branch: `refactor/infrastructure`, based on main
`89267368`. Task 21 is integrated at `af55af80`. This task retains cross-domain
infrastructure in its existing layer; it does not introduce artificial feature wrappers.
The inherited uncommitted tests and receipt were reviewed against current code before
completion. Earlier blanket verification and safety claims are superseded by this receipt.

## Changes

- Advisory-lock acquisition failures destroy the checked-out session before propagating
  the error. An uncertain lock cannot be returned to the idle pool.
- Unlock failures also destroy that session. Repeated/concurrent release calls perform
  cleanup once. Normal lock acquisition and contention behavior remain unchanged.
- `SyncManager` now closes its pool after contention or lock acquisition failure. A
  contested run remains a successful skip; acquisition failure is reported as a failed
  precondition. Neither path clears the cache or reports a completed sync.
- Tests cover cleanup, all three modes sharing key `823744`, success/failure cache
  invalidation, real PostgreSQL session contention, and recovery after failed unlock.
- Cache tests retain domain-prefix behavior and exercise season switching through the
  actual Standings service. No cache TTL, key format, HTTP policy, or provider behavior changes.

## Retained ownership

| Boundary                                                                        | Owner and reason to retain it                                                                        | Contract and limitation                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/db/client.ts`, `connection-config.ts`, `cli.ts`                        | Shared database infrastructure; web, ingestion, and maintenance all consume connection configuration | Canonical pool/Drizzle construction and `SKIP_DB` mock. The raw client has no `server-only` marker; feature server entrypoints provide that boundary. CLI pool creation does **not** enforce remote-target approval; each command owns its checks.                                                         |
| `src/lib/db/schema.ts`, `schema-validation.ts`, committed `drizzle/` migrations | Shared persistence model and readiness                                                               | 37 tables; read-only readiness checks; no schema changes in this task. Schema mutation remains an explicit migration operation.                                                                                                                                                                            |
| `src/lib/db/mutations/*`, `src/lib/sync/repositories/*`                         | Provider-ingestion persistence, spanning domain tables                                               | Season-qualified writes and explicit source ownership. The price-history repository owns history plus its checkpoint transaction; catalogue owns the current price cache.                                                                                                                                  |
| `src/lib/db/queries/*`, `src/lib/services/*`                                    | Remaining compatibility adapters and shared query helpers                                            | Retained where current consumers remain. Final adapter retirement belongs to Task 25, not a bulk deletion in this audit.                                                                                                                                                                                   |
| `src/lib/sync/index.ts`, `manager.ts`, `pipeline.ts`, steps/services            | Cross-domain sync orchestration                                                                      | 14 declared steps after the price-history fix. Routine/bootstrap/live share a session lock, validate schema and season, and stop after a failed step. Earlier writes are not globally rolled back. Selecting one step does not execute its dependencies automatically.                                     |
| `src/lib/sync/advisory-lock.ts`                                                 | Session-lock resource lifecycle                                                                      | Dedicated checked-out session, nonblocking contention, release/destroy on cleanup. Missing pool/query methods retain the existing test/build bypass. Session affinity is required; this is not a lease renewed during arbitrary network failure.                                                           |
| Biwenger board, price history, game and tournament services                     | Source-owned ingestion feeding multiple read domains                                                 | Board owns transfers, bids, finances and prediction pools; games own sporting facts; tournaments own their imported tables. News composes Market and Matches reads and has no separate RSS/news writer to migrate.                                                                                         |
| `scripts/sync/preflight.ts`                                                     | Operational readiness                                                                                | Reads configuration/schema/season before writes; does not mutate data.                                                                                                                                                                                                                                     |
| `scripts/euroleague/*`                                                          | Official website collection, mapping and import tooling                                              | Collection artifacts and dry-run/apply boundary stay operational. Apply uses an explicit transaction and advisory transaction locks.                                                                                                                                                                       |
| `scripts/db/*`                                                                  | Database administration                                                                              | Audits, validation, fingerprints, migrations, repairs and lifecycle commands have distinct policies. Schema/season audits guard remote targets; price repair requires apply plus remote opt-in; production reconciliation requires its backup/remote flags. These are not guarantees supplied by `cli.ts`. |
| `scripts/dev/biwenger-credential-maintenance.ts`                                | Credential maintenance                                                                               | Dedicated remote opt-in and existing credential semantics retained; no rotation or secret access performed.                                                                                                                                                                                                |
| `scripts/analysis/*`, `scripts/hoopgrid/*`                                      | Offline domain command adapters                                                                      | Feature contracts established by Task 21 remain in place.                                                                                                                                                                                                                                                  |
| `scripts/finance/manager-cash-ledger.ts` and its manual workflow                | Read-only reporting                                                                                  | Existing SQL report retained; GitHub workflow defaults PostgreSQL transactions to read-only. No ledger calculation changes.                                                                                                                                                                                |
| `src/lib/utils/cache.ts`                                                        | Shared process-local TTL utility                                                                     | Stores completed results, evicts by prefix or globally. Does not coalesce concurrent misses or cancel pending factories when cleared.                                                                                                                                                                      |

## Cache and identity contract

The caches have different lifetimes and must not be treated as one invalidation system:

- **Process-local TTL:** Standings heatmap, position changes, rivalry matrix and
  all-play-all use `advanced:<calculation>:<resolved season>` keys with a 900-second TTL.
  All-play-all resolves the requested season before lookup and shares its raw cache with
  the legacy adapter. The added contract test switches A → B → A and verifies selective eviction.
- **Historical Season Review:** model and overview keys explicitly select `2025-26:v3`
  and last 3,600 seconds. Scenario results use the validated serialized configuration
  and shock with `v3`; their model is fixed to that historical season. These are shared
  calculations, not account-specific results. Supporting another season requires updating
  that domain's model/key contract together.
- **Request memoization:** React `cache()` wrappers remain in the owning read services
  and app season context. They do not provide a distributed invalidation channel.
- **HTTP and identity:** existing session-read route tests verify query/session identity
  precedence and `private, no-store, max-age=0, must-revalidate`, including errors.
  Private Lineup, Market, Accounts and Assistant contracts retain their existing policies;
  this task adds no shared cache for private responses.
- **Browser session storage:** `useApiData` is a separate optional cache; existing Market
  transfer/trend/duel consumers retain their keys and TTL behavior. It is not cleared by
  server `clearCache()`. UI consumer consolidation belongs to Tasks 25–26.

Successful `SyncManager` completion clears only its own process's Map. A scheduled
GitHub worker cannot invalidate Maps in running web instances, HTTP caches, or browser
storage. Web TTL/HTTP freshness remains the existing behavior. Failed or skipped syncs
do not clear the Map; partial database writes can still have committed. This is not
transactional read-snapshot protection. Distributed invalidation and concurrent-miss
coalescing are separate behavior changes, not claimed by this migration.

## Operational limits retained

The routine/bootstrap/live lock does not cover every administrative command. The
standalone playoff JSON importer checks season writability but does not use SyncManager's
lock or cleanup pipeline. `scripts/db/season-lifecycle.ts` probes lock availability before
its mutation, releases the probes before the write, and uses pool queries rather than a
pinned session. Its backup flag therefore does not guarantee exclusion throughout the
mutation. Operators must stop conflicting writers for these standalone operations;
transactional lifecycle locking and importer consolidation require a separate focused fix.

No production sync, production database mutation, schema migration, provider mutation,
credential operation, or deployment configuration change was run for Task 22.
The new PostgreSQL tests start their own disposable loopback cluster and ignore application
connection credentials. No browser verification is needed because presentation is unchanged.

## Validation

All commands use Node 24.20.0. Logs are retained outside the repository under
`/tmp/task22-*.log`; no production data is included in this receipt.

- Baseline on unchanged main `89267368`: `SKIP_DB=true npm run test:run -- src/lib/sync/__tests__/manager.test.ts src/lib/utils/__tests__/cache.test.ts src/lib/db/__tests__ src/app/api/__tests__/session-read-cache.test.ts --maxWorkers=2`: **172 passed, one optional database test skipped**.
- Initial three-suite focused run: 29 passed and one existing manager-test import exceeded the default five-second timeout. No assertion or repository timeout setting was weakened. The final full suite passed with the default timeout.
- Focused command: `RUN_SYNC_LOCK_DB_TESTS=true SKIP_DB=true npm run test:run -- src/lib/sync/__tests__/advisory-lock.integration.test.ts src/lib/sync/__tests__/advisory-lock.test.ts src/lib/sync/__tests__/manager.test.ts src/lib/utils/__tests__/cache-lifecycle.contract.test.ts src/features/standings/server/all-play-all-cache.contract.test.ts --maxWorkers=2 --testTimeout=30000`: **35 passed**, including two real PostgreSQL tests in a new disposable cluster.
- `npm run verify`: **passed in full**, with `SKIP_DB=true` for every child command:

| Command                              | Result                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------- |
| `npm run skills:check`               | Passed, six repository skills                                                                 |
| `npm run architecture:check`         | Passed, 1,101 modules and 99 protected entrypoints                                            |
| `npm run docs:check`                 | Passed, 125 vault notes                                                                       |
| `npm run typecheck`                  | Passed                                                                                        |
| `npm run test:run -- --maxWorkers=2` | 2,848 passed; eight optional tests skipped, including the two lock tests run separately above |
| `npm run lint`                       | Passed; zero errors and 24 existing image-element warnings in unchanged files                 |
| `npm run build`                      | Passed; compilation, TypeScript, and all 52 static pages                                      |
| `npm run db:audit:schema:metadata`   | Passed                                                                                        |
| `npx --no-install drizzle-kit check` | Passed                                                                                        |
| `git diff --check`                   | Passed                                                                                        |

Changed TypeScript and Markdown files passed Prettier checks. Final `npm run docs:check`
and `git diff --check` passed after updating this receipt. Presentation is unchanged; no browser run or
production/provider operation is used as validation.
