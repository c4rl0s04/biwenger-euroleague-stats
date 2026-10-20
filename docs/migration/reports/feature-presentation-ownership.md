---
title: Feature presentation ownership closure
description: Final owners for legacy presentation, domain helpers, artifacts and framework enforcement.
audience:
  - maintainer
  - contributor
status: active
---

# Feature presentation ownership closure

Date: 2026-10-20. Base: `f1555d42`. Branch: `refactor/feature-ownership-closure`.
Worktree: `../biwengerstats-next-feature-ownership-closure`. Implementation commit: `3c090455`. CI and integration pending.

## Changes

- Lineup owns its 14 existing desktop components, two phone clients and automatic-lineup action/modal.
  Schedule consumes the public action and retains its current exclusions, loading and visual composition.
- The Lineup section route delegates to its typed feature service and screen. Existing Managers reads,
  caller-resolved identity, no-cache policy and HTTP/provider commands are preserved.
- MobileRecordList receives explicit rows from Players, Teams, Tournaments, Compare and Lineup projections.
  Tests compare its HTML with the original renderer, including zero/empty/null values, IDs, the first-20
  limit and existing ordinal-only Insights, transfer, offer and comparison presentation.
- The user chose a shared competition UI contract for reused StatsTable, StatsList and BaseRow.
  Generic table primitives remain in UI. Shared domain components cannot import feature/server internals;
  pure competition helpers and global UI cannot depend on the domain UI entrypoint.
- Shared identity colors, team/round names, score presentation and court placement use competition's pure
  contract. Market owns currency/analytics helpers; Lineup owns its price formatting. The scoring reference
  formula has competition ownership. Unused thresholds and 21 unconsumed compatibility shims are retired.
- Season Review owns its generated JSON artifacts. Readers, script defaults, workflow output/staging paths
  and documentation point to their new location; artifact bytes are unchanged.
- All five omitted product entrypoints are registered. Architecture checking inventories every page,
  layout and route automatically; only database health retains its explicit infrastructure exclusion.
  New global domain component folders and phone screen folders are rejected.

## Verification

- Node 24.20.0 worktree setup passed; no environment files or provider credentials copied.
- Focused baseline: Lineup, Schedule boundary and architecture tests — 65 passed.
- AST comparison: all 19 moved component implementations match their originals; both JSON artifacts are byte-identical.
- Final focused tests: 202 passed across 22 files; the separate Season Review service suite passed 4 tests.
- `npm run architecture:check`: passed, 1,100 modules and 131 protected entrypoints.
- `SKIP_DB=true npm run typecheck`: passed.
- `npm run docs:check`: passed, 140 vault notes. Removing empty legacy directories exposed three stale
  Assistant/Hoopgrid links; those links now target the feature owners and the fresh-directory check passes.
- `SKIP_DB=true npm run db:audit:schema:metadata`: passed, 39 source/snapshot tables, no database connection.
- `node node_modules/drizzle-kit/bin.cjs check`: passed. The initial nested npm-exec invocation failed
  with EUSAGE; invoking the installed CLI directly resolved the command issue.
- `git diff --check` and `git diff --cached --check`: passed.
- Touched-file Prettier formatting passed; the commit hook's `npx lint-staged` passed formatting/lint
  for 196 staged JS/TS files and formatting for three JSON files. Its only subsequent edit was whitespace.

All npm checks used `npx --yes --package=node@24.20.0 --call '<command>'`. Focused baseline command:

```bash
SKIP_DB=true npm run test:run -- src/features/lineup src/features/schedule/boundary.test.ts scripts/architecture/check.test.mjs --maxWorkers=2
```

Final focused command:

```bash
SKIP_DB=true npm run test:run -- \
  src/components/mobile/MobileRecordList.test.tsx src/features/lineup \
  src/features/schedule/boundary.test.ts src/features/players/architecture.test.ts \
  src/features/season-review/boundary.test.ts src/features/market/architecture.test.ts \
  src/features/market/analytics/components/renderers/metric-registry.contract.test.tsx \
  src/features/market/screens/server/market-section.contract.test.tsx \
  src/features/market/analytics/lib/analytics.test.ts scripts/architecture/check.test.mjs \
  src/tests/architecture/ownership-inventory.test.ts src/lib/competition/presentation \
  src/lib/competition/logic/__tests__/fantasy-scoring.test.ts --maxWorkers=2
SKIP_DB=true npm run test:run -- src/features/season-review/server/services/season-review.service.test.ts --maxWorkers=2
```

Intermediate focused runs identified test-harness issues: an extra field absent from the real squad
model, legacy `.js` JSX imported by a service-boundary test, and a mock-returning beforeEach treated as
cleanup by Vitest 5. The fixture now matches the actual contract; the boundary test isolates presentation;
the setup hook returns void. Failed subsets were rerun after these fixes and the final combined run passed.
The error-propagation assertion remains in place. Production error handling was unchanged.

The full unit suite, full lint, production build and browser matrix are deferred to CI at the user's
request for focused local validation. No local browser comparison has run; actual layout/bundling still
needs CI acceptance. No provider writes, database/schema mutations, credential operations or deployment
changes were performed. Legacy visual tokens, cards and theme compatibility remain for later UI adoption.
