---
title: Architecture campaign execution
description: Current checkpoint, closed-inventory progress and acceptance evidence for the completion campaign.
audience:
  - maintainer
  - agent
status: active
---

# Architecture campaign execution

## Current checkpoint

Implementation authorized by the user after approval of the [completion plan](completion-plan.md).
Branch: `refactor/architecture-completion`.
Worktree: `../biwengerstats-next-architecture-completion`.
Fetched main/origin/main: `354f66e1585cb59a15efe96f094defdba6ad1e65`.
Campaign base carries planning commit `6ad78eb8`; no unrelated branch was incorporated.

**C00 and C01 IN PROGRESS; C02–C04 IMPLEMENTED AND LOCALLY VERIFIED.** The Manager directory checkpoint
is implemented; see [C01 evidence and remaining scope](reports/c01-manager-reads.md).
The full goal remains all C00–C15 packages, not merely the first migration.
The [C02 Tournament receipt](reports/c02-tournament-reads.md) records source contracts,
complete Tournament read implementation and local acceptance at e14fe39a. It is unmerged/undeployed;
Campaign-wide Linux/full-viewport acceptance remains C14.
Sensitive policy changes and production release remain explicit gates in the plan.

C03 backend and screen ownership are implemented; see the
[Predictions receipt](reports/c03-prediction-reads.md). Queries, mappers, calculations and orchestration
now belong to Predictions, with deliberate Compare/Home contracts. Original desktop/phone references
and final candidate comparison passed, including both ranking drawers. Full source verification passed;
C03 is locally accepted, unmerged and undeployed. C14 retains campaign-wide
viewport/Linux closure and C15 remains the release gate.

C04 Playoffs is also locally accepted; see its [receipt](reports/c04-playoff-reads.md).
Typed read/screen services, a deliberate Teams label contract, both pages and original-reference
browser comparisons are verified. Full verification passed 1554 tests plus one skip.
C05 public Market analytics is in progress, excluding private provider actions. Its
[receipt](reports/c05-market-reads.md) records recommendation extraction at `deda942d`, the
trends boundary at `e3dad14b`, and subsequent transfer/detail/basic-summary boundaries. Those
checkpoints moved five scoped read APIs; the later checkpoint G below closes the sixth.
Do not treat data checkpoints as complete Market screen acceptance.
Checkpoint E closes Team competition helper ownership and moves Team Profile detail orchestration
above queries. Its focused 197-test suite and full verification (1,742 tests plus one skip) pass;
SQL and original probability comparisons are unchanged. Player form and remaining Market consumers
still need closure. See the C05 receipt before continuing.
Checkpoint F owns Market listing/opportunity queries, models, mappers and services. Market now
consumes Players form through its deliberate server contract, not the global query. Legacy
forwarders preserve aggregate/Dashboard/Assistant callers. Focused checks pass 199 tests; full
verification passes 1,751 tests plus one skip, with unchanged lint/build warnings. Shared Player
form still has non-Market callers and remains explicitly pending ownership closure.
Checkpoint G migrates the remaining 30 Market statistical read functions (31 unchanged SQL
templates), typed aggregate and GET `/api/market/stats`. Global Market query implementations are
gone; all six scoped read APIs use owned services, including a deliberate Managers directory
contract. Focused validation passes 247 tests and full unit validation passes 1,850 plus one
skip; full build/schema acceptance passes with unchanged lint/build warnings. Market pages/components and original-reference
desktop/phone verification remain pending; private operations stay frozen under C11.

## Inventory discovery

Checkpoint H moves the `/market` overview and 49 desktop modules into Market ownership,
with a typed phone model/service and unchanged browser-loaded desktop analytics. Full
verification passes (1,864 tests plus one skip; graph 907 modules/59 entrypoints), with
unchanged lint/build warnings and schema metadata. An original-code browser repetition
reproduced the phone prefetch-cancellation test failure. Following actual section/back
links instead of replacing documents passes three original and six candidate repeats,
with five unchanged screenshots and no guard suppression. Original baseline source and
test evidence are retained on `chore/market-visual-baseline` at `ba37d245`.
The existing bids server failure remains visible and needs the separate approved behavior
decision. Sections, populated/drawer coverage and remaining Market closure are not done.

Checkpoint I adds an opt-in populated Market fixture without changing the default seed
or application code. Original references are preserved at `c9f609d5`; four original and
four candidate desktop/phone repeats pass against six byte-identical images. Coverage
includes listings/filtering, recent activity, investment/transfer sections and the transfer
ranking drawer. Full source verification passes 1,872 tests plus one existing skip with
unchanged warnings. Both default-fixture cases also pass with five unchanged references.
This accepts the bounded fixture/browser checkpoint only. Other drawers, listing
expansion, duel interaction, rolling charts, sections and shared-form ownership remain
open; the pre-existing bids failure remains visible, not suppressed. See the C05 receipt.

Checkpoint J closes shared Player-form ownership locally. A leaf `features/player-form`
owns the single form query/calculation; Teams and Players consume its deliberate server
contract without a reverse feature cycle. Roster/catalogue enrichment moves from queries
to services, and the legacy form implementation/Players query adapter are removed. Original
output/SQL/call-order comparison passes 36 cases; all five SQL templates also match exactly.
Focused tests pass 325 cases; full verification passes 1,894 plus one existing skip,
with unchanged lint/build warnings and schema metadata. Four default Team/Matches/Market
and two populated Market browser cases pass with unchanged references. No page/component
source changed. The existing bids failure and remaining Market scope are still open.

Checkpoint M follows committed L (`876a05fa`). The Market drawer boundary now has typed
category-specific client-local configuration and TSX props, with unchanged emitted runtime
AST for the drawer/parent. Phone section scaffold/descriptions move into the feature and
preserve original markup. Ten drawer contracts, five scaffold comparisons and an ownership
assertion accompany this work. Full verify passes 1,937 tests plus one existing skip,
graph 920/60, typecheck, lint (24 existing warnings), build and offline schema/Drizzle checks.
Default/populated desktop/phone browser runs pass four cases with twelve unchanged originals.
Renderer/metric internals, further interactions, broader visual closure and bids remain open.

Checkpoint L follows committed K (`be0c2e5b`). Non-bids phone transfers/trends/investments
now use a typed row projection and feature service; the section route no longer imports
the legacy service barrel and is graph-protected without a new exception. The known bids
failure remains isolated and uncorrected, so this is not full section/C05 closure. Focused
tests pass 196 cases; full verify passes 1,921 plus one existing skip, graph 918/60,
typecheck, lint (24 existing warnings), build and offline schema/Drizzle checks. One earlier
graph timeout passed in isolation and did not recur in the full rerun; no guard was relaxed.
Default and populated desktop/phone browser comparisons pass four cases with all twelve
original images unchanged. Broader viewports/Linux and the remaining Market tasks stay open.

Checkpoint K types the existing duel selection/matrix/detail presentation without changing
their emitted runtime logic. Nine render contracts and 174 focused Market/API cases pass.
Original baseline `df01154f` preserves the duel detail reference and click/keyboard/reverse
selection checks; two non-updating original repeats and both candidate desktop/phone cases
pass. Moving the pointer before scrolling avoids an accidental hover capture difference;
the original image and all prior references remain unchanged. A fresh isolated full
verification passed: 1,903 tests plus one existing skip, graph 914/59, typecheck, lint
(24 existing warnings), build, offline schema/Drizzle and diff checks. The earlier graph
timeout did not recur. Checkpoint K is locally accepted for duel presentation only.
Other drawer categories, listing expansion, rolling charts, phone sections and broader
presentation/full-viewport closure remain open; the bids correction is still unapproved.

C05 screen baseline now pins five empty-state desktop/phone references against unchanged
screen source at `91a3ea7f`. Two real-page characterization tests and a fresh two-project
non-updating browser comparison pass. The receipt records the pre-existing phone bids
failure and stream-close logs; neither is suppressed or treated as full screen acceptance.
Populated data/drawers and actual screen migration remain next, with a separate approval
required for the bids behavior correction. No private operation or production change occurred.

[Source inventory](campaign-inventory.json) records 794 non-test source modules and
136 discovered framework/auth entrypoints (including root boundaries), with direct imports and preliminary package
assignments. It uses the repository's existing TypeScript-resolved architecture graph.
Assignment is a triage queue, not evidence of correct ownership or a completed security review.

AST export discovery additionally records 82 explicit HTTP method exports (including Auth.js aliases),
route cache declarations, 57 ancillary script/worker/configuration/style files and 47 package commands.
These inventories are coverage evidence, not semantic acceptance or permission to execute commands.

Remaining C00 work:

- Reconcile all exported HTTP methods, including aliases/re-exports and framework-generated methods.
- Trace actual calls rather than treating every import of a legacy barrel as a runtime dependency.
- Record access/identity, cache layers/keys, models, data sources and side effects per entrypoint.
- Extend coverage to scripts/jobs, public workers/assets and non-JavaScript runtime/configuration files.
- Associate existing tests with actual contracts; missing tests remain explicit.
- Review mixed-package assignments and remaining infrastructure candidates; none is exempt by default.
- Reconcile old status headings through current-release links without deleting historical evidence.

## Initial source findings

- `src/lib/services/statsService.ts` owns global Tournament calculations. It belongs to C02,
  not Managers merely because it produces per-manager statistics.
- `src/lib/services/core/userService.ts` still wraps global directory/profile reads.
  The profile services already exist; C01 must inventory callers before retiring wrappers.
- `src/lib/db/queries/core/users.ts` mixes directory, squad/captain/home-away/alert reads and
  `getUserWithPassword`. Credential-related access remains C11a, not incidental C01 cleanup.
- The shared `manager-directory.ts` query deliberately avoids a feature cycle. Keep that
  reviewed shared projection unless a source-backed acyclic ownership alternative is established.
- `/api/users` currently calls the legacy service barrel, uses force-dynamic and LONG success caching.
  Preserve its exact response/ordering and runtime text IDs/nullability in C01.

## Validation and preservation

- Worktree setup PASS: Node 24.20.0, 688 packages; no lockfile edits.
- Existing esbuild-kit deprecation and install-script approval notices retained unchanged.
- Baseline `npm run verify`: PASS. Skills (6), graph (794 modules/44 protected entrypoints),
  typecheck, 1,277 tests plus one existing skip, lint (0 errors/25 existing image warnings),
  SKIP_DB production build, 38-table metadata audit, Drizzle check and diff check passed.
  Missing-provider build warnings are unchanged. No application environment files were present.
- Built app-paths manifest reconciliation: 125 entries, zero missing inventory routes after
  explicitly accounting for generated internal boundaries and manifest.webmanifest.
- Updated documentation checks passed; disposable browser baseline completed: 90 PASS (10.1 minutes).
- C01 directory, performance and preparation implementation passed full verify: 1,305 tests,
  one existing skip; graph 806 modules/45 protected entrypoints; unchanged lint/build warnings.
  Candidate browser verification for c9d6a816 PASS: 90 tests (9.1 minutes), all nine viewports.
  See the C01 receipt for scope, existing teardown messages and retained adapters.
- No environment files copied, production operations, secrets, provider calls, push or deployment.
- Existing PWA/Season Review/sync branches and both pre-existing stashes remain untouched.
  Their detailed ancestry/content classification remains part of C00/C14; no blanket merge/deletion.
