---
title: Market value sync validation
description: Implementation evidence and rollout status for independent provider price-history reconciliation.
audience:
  - contributor
  - operator
status: active
---

# Market value sync validation

Implementation date: 2026-09-27. Branch: `fix/market-value-sync`, based on `f74f22ab`.

The normal sync now owns an independent `biwenger-price-history` step. It reconciles provider-dated
history for every season player, independently of global identity or catalogue membership. Missing
records are inserted and differing prices corrected. Catalogue snapshots only update the current
season price cache. Per-player checkpoints and price writes commit atomically using the existing
schema. See the [sync runbook](data-sync.md#daily-player-price-history) for semantics and recovery.

## Validation evidence

- `npm run worktree:setup`: passed with Node 24.20.0; no environment files copied.
- Baseline: `SKIP_DB=true npm run test:run -- src/lib/sync src/lib/db/mutations/__tests__/players-season-isolation.test.ts --maxWorkers=2`: 138 passed on unchanged main.
- Focused: `SKIP_DB=true npm run test:run -- src/lib/sync/services/biwenger/__tests__/price-history.test.ts src/lib/sync/__tests__/price-history.test.ts src/lib/sync/services/biwenger/__tests__/catalog.test.ts src/lib/sync/__tests__/pipeline.test.ts --maxWorkers=2`: 45 passed.
- `RUN_PRICE_HISTORY_DB_TESTS=true SKIP_DB=true npm run test:run -- src/lib/sync/repositories/price-history.integration.test.ts`: 3 passed against a newly created disposable PostgreSQL cluster with committed migrations. Covers the September 24/25 pattern, unchanged reruns, frozen-season preservation, retained current-price cache and checkpoint-failure rollback.
- `npm run verify`: skills, architecture, documentation and typecheck passed. The initial full suite had 2,819 passes, five timeouts and five skips under machine load; the verifier stopped at tests.
- Retried the four affected test files with `SKIP_DB=true npm run test:run -- src/lib/services/features/__tests__/assistantContextService.test.ts src/features/accounts/__tests__/account-command.service.test.ts src/lib/sync/__tests__/manager.test.ts scripts/dev/prepare-maplibre.test.ts --maxWorkers=1`: 31 passed, one assistant-context timeout remained.
- Baseline confirmation: `SKIP_DB=true npm run test:run -- src/lib/services/features/__tests__/assistantContextService.test.ts --maxWorkers=1` on unchanged main reproduced that five-second timeout (nine passed, one timed out).
- `SKIP_DB=true npm run test:run -- --maxWorkers=2 --testTimeout=30000`: all 2,824 tests passed; five opt-in tests skipped. Only the command-line execution allowance changed, not assertions or repository test configuration. The three new opt-in SQL tests were run separately as above.
- Read-only provider smoke check: fetched two existing player histories through the normal client and validated 10 and 8 active-season prices with the new parser. No provider or database mutations.
- `npx --no-install prettier --check` on the seven new TypeScript files: passed.
- `node scripts/dev/check-docs.mjs` and Prettier on the updated runbook: passed.

- `SKIP_DB=true npm run lint`: passed, zero errors; 24 existing image-element warnings in untouched UI files.
- `SKIP_DB=true npm run build`: passed, including production compilation, Next.js TypeScript validation and static generation. No sync modules are imported by application entrypoints; the final CLI-only retry change was separately typechecked and tested.
- `SKIP_DB=true npm run db:audit:schema:metadata`: passed, 37 source and snapshot tables with no differences.
- `SKIP_DB=true npx --no-install drizzle-kit check`: passed.
- `git diff --check`: passed.
- Final retry-edge checks: `RUN_PRICE_HISTORY_DB_TESTS=true SKIP_DB=true npm run test:run -- src/lib/sync/services/biwenger/__tests__/price-history.test.ts src/lib/sync/repositories/price-history.integration.test.ts --maxWorkers=1`: 14 passed, including four disposable PostgreSQL tests. Forced refresh invalidates selected checkpoints before fetching so a subsequent failure or interruption remains due for routine retry. Other seasons, players and all price records remain untouched by checkpoint invalidation.

- Final `npm run typecheck`: passed after the retry-edge change.
- Final `SKIP_DB=true npm run test:run -- --maxWorkers=2 --testTimeout=30000`: 2,825 passed, six skipped (four new SQL tests executed separately).
- Final `npx --no-install eslint src/lib/sync/repositories/price-history.ts src/lib/sync/services/biwenger/price-history.ts src/lib/sync/services/biwenger/__tests__/price-history.test.ts src/lib/sync/repositories/price-history.integration.test.ts`: passed with no warnings.
- Documentation reachability and formatting were rechecked after adding this receipt; passed for 123 notes.

## Rollout status and limits

No production data has been changed by this implementation task. The earlier read-only audit found
83 missing provider-available September 25 records and 66 differing September 24 prices; those counts
must be checked against fresh provider data when recovery is executed. No temporary backfill script,
schema migration, workflow schedule change or environment-variable change is included.

A 335-player simulated run with two concurrent requests and the provider client's maximum configured
five-second delay requires 14 minutes of pacing. This excludes HTTP/database latency and other pipeline
steps; the real scheduled job's 30-minute total budget remains a rollout check. Checkpoints make
interrupted work resumable. No browser verification was run because there are no presentation changes.
