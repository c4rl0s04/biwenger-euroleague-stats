---
title: C03 Predictions read migration
description: Source contracts, dependency ownership and baseline evidence for the Predictions read slice.
audience:
  - contributor
  - agent
status: active
---

# C03 Predictions read migration

Baseline: 661f545d on refactor/architecture-completion. IMPLEMENTED AND LOCALLY VERIFIED.
Unmerged and undeployed; campaign-wide viewport/Linux closure remains C14. Historical checkpoints follow.
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

## Original data flow

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

## Query, mapper and orchestration checkpoint

The feature now owns both server-only SQL reads, explicit database record contracts, allowlisted
mappers and getPorrasStats orchestration. Pages still use the legacy predictionsService adapter;
its removal belongs to the forthcoming screen migration. Compare consumes the deliberate server
contract; Home consumes its exported normalization SQL contract (season bound at $1).
The old Predictions query, normalization module and DB barrel export are removed after consumer
searches. Their characterization tests moved into the feature rather than being deleted.

Both query template expressions and the entire normalization module were compared against
cc65f916 and are unchanged. Each query still resolves its season independently; no cache was added.
Nullable names/icons reflect the existing schema. Tests preserve the original nullable-history-name
failure and leading-zero ID behavior rather than silently correcting external behavior.

Verification: typecheck and architecture checks passed (829 modules/48 protected entrypoints).
Full unit suite passed 1521 tests plus one skip; two additional contract cases subsequently passed
in the focused 14-test Predictions suite. Lint passed with the existing 24 image warnings.
Schema metadata passed with 38 tables and no drift; Drizzle consistency passed without a database
connection. A fresh SKIP_DB=true production build passed after the earlier process handle expired;
only the expected missing-provider configuration notices appeared.
No UI, schema, provider, authentication, dependency or production configuration changes are included.

This is not complete C03 acceptance. Next: populated original browser fixtures/references, typed
screen composition, direct page-to-feature services, adapter removal and complete verification.

## Original browser reference capture

Created chore/predictions-visual-baseline at cc65f916 in the sibling Predictions baseline worktree.
Only the browser test and generated reference assets differ from that original application.
The disposable run passed both iPhone 13 and desktop 1440 cases (36.8 seconds), capturing six macOS
references: overview on both presentations and all four phone sections. A repeat without snapshot
updates is running; candidate comparison and additional desktop interaction coverage remain pending.
The test inserts two synthetic porras rows into the guarded disposable fixture and removes exactly
those returned IDs afterward, leaving shared Home fixtures unchanged. No production database is used.

A typed phone-section mapper now pins the existing generic labels, ordering, first-20 limit and
ranking links without passing arbitrary records to presentation. It is not wired into pages yet.
All 17 focused Predictions tests passed. Screen ownership and full acceptance remain outstanding.

## Screen implementation and candidate comparison

Both pages now call feature services directly and compose public feature screens. Desktop components
moved intact; phone overview uses PorrasStats instead of Record<string, any>. Phone sections consume
explicit mapped rows, retaining the original generic labels and missing-value output. The legacy
predictionsService adapter and global component paths have no remaining consumers and are removed.
The main page was renamed to TSX so actual page execution can be tested without changing test tooling.
Section guards still run before reads; page revalidation remains 300 and no server cache is introduced.

The original repeat passed both cases without snapshot updates (29.3s); references are committed
on the original branch at 8cfaa79. Candidate desktop/iPhone checks passed against the same six PNGs
(34.2s), before the subsequent rendering-identical main-page TSX rename. No browser guard was relaxed.
Desktop overview and phone ranking references were visually inspected; broader desktop interactions
and campaign-wide viewport/Linux coverage remain pending, not implied by these two passing cases.
Typecheck and graph enforcement passed before the rename (832 modules, 50 protected entrypoints).
All 21 focused tests now pass, including actual page contracts and obsolete-entrypoint guards.
Full acceptance and final post-rename verification are still required before committing this slice.

Final source verification passed: npm run verify completed skills, architecture (832 modules/50
entrypoints), docs (87 notes), typecheck, full suite (1531 passed/one skipped), lint (24 existing image
warnings), production build, schema metadata (38 tables/no drift), Drizzle and diff checks.
The two added service tests also passed in the focused 23-test run. All fifteen moved desktop modules
have identical emitted JavaScript to 502dc477. Both ranking drawers passed on the original application
(18.8s); that test-only extension is retained at original-reference commit 2e738b58.
The final post-rename candidate browser run, including both drawers, passed both cases (33.4s),
with all six original screenshots unchanged and no browser/API error guard failures. The disposable
database stopped normally. This closes local Predictions read acceptance, not campaign/release closure.
Remaining work: C14 full viewport/Linux and aggregate regression evidence; C15 authorized release.
Prediction ingestion remains assigned to C12/C11e, unchanged by this read slice. Next read owner: C04 Playoffs.
