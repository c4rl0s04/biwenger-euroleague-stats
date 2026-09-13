---
title: C03 Predictions read migration
description: Source contracts, dependency ownership and baseline evidence for the Predictions read slice.
audience:
  - contributor
  - agent
status: active
---

# C03 Predictions read migration

Baseline: 661f545d on refactor/architecture-completion. IN PROGRESS; no application migration yet.
The preceding full campaign verification passed 1507 tests plus one skip and Tournament browser checks.

## Routes and consumers

- /predictions: metadata unchanged; revalidate = 300. Statistics and phone detection start in
  parallel; phone uses MobilePredictionsScreen, desktop uses PredictionsClient below PageHeader.
- /predictions/[section]: requireMobileRoute runs before reading statistics. Sections are evolution
  (performance), ranking (table_stats), teams (predictable_teams), history (history.jornadas).
  Existing mobile registry owns invalid-section and desktop redirect behavior.
- No dedicated Predictions HTTP endpoint or browser mutation was found in these screens.
- Compare's full and lite services call getPorrasStats and expose promedios/victorias. Preserve
  those contracts; only change their dependency adapter, not Compare behavior or ownership.
- Home feed embeds PREDICTION_NORMALIZATION_CTES. Share a deliberate normalization contract;
  do not duplicate the SQL or deep-import the new feature's query internals.
- Playoffs predictions are a different C04 domain and scoring implementation.

## Current data flow

Pages -> predictionsService -> global DB barrel -> getPorrasStats in predictions query module.
That module mixes public interfaces, two SQL reads, orchestration and pure calculations.
The first SQL read normalizes conceptual regular/postponed rounds; the second calculates predictable
teams using a separate per-round sequence. Preserve this distinction and both SQL expressions.

getPorrasStats reads normalized predictions once, starts achievements/participation/table/performance/
history calculations in the existing Promise.all order, then clutch, victories, predictable teams and
best round. Each database read independently resolves the season. No server memoization exists.
Table output is also referenced as porra_stats.promedios. Authentication stays in existing app
boundaries; no session-derived identity or new API is introduced by this migration.

## Behaviors pinned before editing

- Perfect achievements use complete scores >= 10; blanked means the lowest complete score, not zero.
- Ranking excludes partial rounds but takes identity fields from the first encountered row.
- Every tied round winner receives a victory.
- Clutch chooses the latest three conceptual rounds before filtering partial records.
- Performance sorts its input array in place. Preserve orchestration/order until an equivalent
  pure mapping is demonstrated; do not casually reorder these async calculations.
- Best-round ties use descending round ID and keep the first five complete records.
- History parses user IDs to numbers, then compares their string form against original IDs:
  leading-zero IDs currently produce missing history cells. Preserve this quirk during migration.
- SQL distinguishes prediction strings from fantasy points and maps tied/missing score comparisons
  to X as currently written. Do not repair scoring assumptions as an incidental refactor.

Baseline characterization: eight tests PASS; typecheck and diff check PASS.
No source behavior changed in this checkpoint.

## Writes and excluded work

Prediction pool persistence lives in the existing market/board sync pipeline:
src/lib/db/mutations/market.ts inserts into porras; the pipeline's market/board steps own ingestion.
Keep that infrastructure unchanged and assign its ownership/security review to C12/C11e.
No provider operation, sync command, schema migration or production database operation is authorized.

## Next implementation

Establish features/predictions with explicit records/models, allowlisted mappers, server-only queries,
calculation and screen services, public/server contracts, and desktop/phone composition. Preserve
Compare and Home through deliberate contracts. The current raw-row spreads and phone Record<any>
props are not acceptable final boundaries.

Capture populated original Predictions browser references before moving UI: existing browser fixtures
have no porras seed or Predictions-specific screenshots. Then run focused/cross-feature tests,
architecture/type checks and full/browser acceptance. Do not mark this slice verified prematurely.

## Models and calculation ownership checkpoint

Created features/predictions public models and server-only entrypoint, with the eight existing
calculation functions under server/calculations. The legacy query module imports/re-exports those
contracts temporarily; the two SQL reads and getPorrasStats orchestration remain there for the next
step. No screen, database record mapping, SQL, identity handling or scoring rule changed.

A TypeScript AST comparison against cc65f916 confirms all eleven function bodies are identical:
eight relocated calculations plus the retained orchestrator and two query functions. The baseline
tests now use the normal test-only server-only mock; production retains the real guard.
Focused validation: nine tests PASS (eight behavior tests plus the new boundary test), typecheck,
architecture (826 modules/48 protected entrypoints) and diff checks PASS.

This is an implementation checkpoint, not feature acceptance. Next: dedicated query/record mapper
ownership, the shared Home normalization contract and Compare adapter, then original UI fixtures,
screen/services migration and full acceptance.
