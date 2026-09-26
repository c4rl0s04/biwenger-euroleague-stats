---
title: Architecture migration master tracker
description: Authoritative remaining-task queue, merged-scope evidence and completion gates.
audience:
  - maintainer
  - agent
status: active
---

# Architecture migration master tracker

Last reconciled: 2026-09-24 against fetched `origin/main`
`8dbdce9ca56db0faf40c7a94d58fc94d6c8c9720`.
This is the authoritative task/status queue. The [overview](../architecture/migration-overview.md)
summarizes it; the [ledger](../architecture/migration-status.md) and receipts preserve evidence.
If newer code/history contradicts this checkpoint, refresh the evidence before acting.

Tasks 01 through 12 are integrated in `main` (closing all read-domain migrations, worktree cleanup, and the sensitive-operation inventory). In parallel, the UI migration track has integrated UI-00, UI-01A, UI-01T, and UI-01B (`Button`, `IconButton`, `Input`, `Badge`, `Avatar`, `Skeleton`). No current implementation, cleanup, parallel dispatch, security change or release is authorized merely by a planned row.

## How to read status

- **Planned:** bounded scope identified, not dispatched or implemented.
- **In progress:** work has actually started; this is not a live-process guarantee.
- **Implemented:** source changes committed; acceptance incomplete.
- **Verified locally:** required scoped acceptance recorded for an exact source state.
- **Merged:** ancestry/PR evidence establishes integration; not automatically deployed.
- **Deployed:** explicit deployment ID, SHA and production verification evidence required.
- **Approval gate:** a condition separate from progress, not a claim that all other work is blocked.

For new work, record implementation SHA, verification commands/results, integration SHA/PR and deployment
evidence separately. A documentation or cleanup task can be locally delivered without an application
deployment; its Git publication state still remains explicit. Tests below are recorded historical
evidence unless a new command and source state are given. No whole-feature percentage is inferred.

## Merged read scopes — do not restart

| Scope                                                      | Integration evidence                                                                                                                   | Remaining boundary / owner                                                                               |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Matches, Teams, Players catalogue/profile, Manager Profile | Integrated ancestors; [Task 01 inventory](reports/2026-09-20-reconciliation.json), historical ledger                                   | Team detail orchestration and shared Player form require Task 25 review; earlier screens are not undone. |
| Rounds and Standings read experiences                      | [Release receipt](reports/rounds-standings-release.md), historical deployed application SHA `416ab254`                                 | External Home/Dashboard projections: 06/09; Compare component: 05; final adapter removal: 25.            |
| Search data/API                                            | Integrated `251175d8`; historical ledger                                                                                               | Shell/browser interactions: 23.                                                                          |
| Tournaments reads/screens                                  | [PR #35](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/35), `73402fc6`; [receipt](reports/c02-tournament-reads.md)        | Consumer/visual closure: 25–26; ingestion/commands: 21–22 if discovered.                                 |
| Predictions reads/screens                                  | [PR #36](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/36), `f1ae88da`; [receipt](reports/c03-prediction-reads.md)        | Sync/submissions classified separately in 12/21/22.                                                      |
| Playoffs reads/screens                                     | [PR #37](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/37), `3c2a3ac8`; [receipt](reports/c04-playoff-reads.md)           | Preserve distinct scoring; commands and final verification remain separate.                              |
| Public Market reads/screens                                | [PR #38](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/38), `0253f53f`; [receipt](reports/c05-market-reads.md)            | Private flows: 16–17; Dashboard/Assistant adapters: 06/20/25; known bids defect below.                   |
| Managers remaining reads                                   | [PR #39](https://github.com/c4rl0s04/biwenger-euroleague-stats/pull/39), `1933e033`; [receipt](reports/c06-manager-remaining-reads.md) | Command/security infrastructure: 14–18; downstream adapters: 25.                                         |
| Schedule read experience                                   | Integrated and deployed at `6aa275b6`; [receipt](reports/task-04-schedule.md)                                                          | Lineup submission commands: 15; Assistant adapter: 20.                                                   |
| Compare full/lite reads & screens                          | Integrated at `8bc0af22`; [receipt](reports/task-05-compare.md)                                                                        | Assistant adapter: 20; final closure: 25.                                                                |
| Dashboard data reads                                       | Integrated at `700b727b`; [receipt](reports/task-06-dashboard-data.md)                                                                 | Adapters for News/Home/Assistant retired in 08/09/20.                                                    |
| Dashboard presentation screens                             | Integrated at `c4c55057`; [receipt](reports/task-07-dashboard-screens.md)                                                              | Final closure: 25.                                                                                       |
| News ticker & feed reads                                   | Integrated at `69dfa07f`; [receipt](reports/task-08-news.md)                                                                           | Feed ingestion: 22.                                                                                      |
| Home activity, summary & landing                           | Integrated at `fd424956`; [receipt](reports/task-09-home.md)                                                                           | Shell/layout interactions: 23.                                                                           |
| Season Review data & calculation engines                   | Integrated at `c28481b2`; [receipt](reports/task-10-season-review-data.md)                                                             | Report generation commands: 21.                                                                          |
| Season Review presentation screens                         | Integrated at `0b001b17`; [receipt](reports/task-11-season-review-screens.md)                                                          | Final closure: 25.                                                                                       |
| Sensitive-operation inventory                              | Integrated at `b678cd14`; [receipt](reports/task-12-sensitive-operation-inventory.md)                                                  | Gates Tasks 13–21 provider boundaries, commands, credentials and AI operations.                          |

PRs #35–39 and subsequent tasks through Task 12 are confirmed merged into `main`.
Older deployment receipts remain valid historical observations, not proof about today's production.

## UI migration track

The UI migration runs in parallel with the domain architecture migration, systematically replacing ad-hoc inline styles and legacy global CSS with a tokenized, accessible design system. See [UI foundation](../architecture/ui-foundation-v1.md) and [design direction](../product/ui-design-direction.md).

| Slice      | Scope                                    | State / Evidence                                                                                                                                                  | Next boundary / owner                                         |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **UI-00**  | Visual baseline & design direction       | Completed; documented in `ui-design-direction.md` and `ui-foundation-v1.md`                                                                                       | Informs semantic tokens and primitive specs                   |
| **UI-01A** | Design tokens foundation                 | Completed; base palette, scales, and typography                                                                                                                   | Foundation for semantic theming                               |
| **UI-01T** | Semantic theming & tokens reconciliation | Integrated at `55765dfe`; complete light/dark theme variables, surfaces, text, borders, actions                                                                   | Token layer consumed by UI-01B primitives                     |
| **UI-01B** | Core UI primitives                       | Integrated via PR #44 at `665fd1d7`; [receipt](reports/ui-01b-core-primitives.md). Six primitives: `Button`, `IconButton`, `Input`, `Badge`, `Avatar`, `Skeleton` | Primitives exported from `src/components/ui`; UI-01C controls |
| **UI-01C** | Interactive controls & overlays          | Planned; Dialog/Modal, Popover/Tooltip, Dropdown/Select, Tabs, Toggle/Switch, Checkbox                                                                            | Builds on UI-01B primitives and floating-ui/radix patterns    |
| **UI-02**  | Compositions & shared domain layouts     | Planned; cards, stat displays, table patterns, responsive section wrappers                                                                                        | Consumes UI-01 primitives and controls                        |
| **UI-03**  | Feature screen migration                 | Planned; migrating feature presentation to the design system                                                                                                      | Incremental adoption per domain                               |

## Ordered task queue

Owner for every row is the coordinating migration task until a named assignment is explicitly made.
A future worker assignment must pin base, exact write set and acceptance criteria. No background
workers are dispatched by this document. Scope excludes redesign, unrelated dependency/schema changes,
real provider mutations and changes to credentials/authorization unless separately approved.

### Task 01 — Synchronize and reconcile

- **State:** Integrated and pushed in main `6aa275b6`.
- **Dependencies / approval:** None.
- **Scope:** Refresh main; classify all saved work without deletion.
- **Completion check:** Pinned main and preservation inventory; no stranded work hidden.
- **Evidence:** 143e7f27; Task 01 report.
- **Next action:** Delivered and integrated; retain historical reconciliation evidence.

### Task 02 — Authoritative tracker

- **State:** Integrated and pushed in main `6aa275b6`.
- **Dependencies / approval:** 01.
- **Scope:** Reconcile summaries, history and all remaining scopes; documentation only.
- **Completion check:** One linked tracker, all findings assigned, documentation checks pass.
- **Evidence:** This documentation branch; validation below.
- **Next action:** Keep this tracker current as each task is accepted.

### Task 03 — Approved worktree cleanup

- **State:** Cleanup completed; receipt integrated and pushed in main `6aa275b6`.
- **Dependencies / approval:** 01–02; user approved the Task 03 cleanup plan.
- **Scope:** Remove only approved integrated checkouts after ignored-file preservation; no unique branches/stashes.
- **Completion check:** Cleanup receipt lists exact removals and recovery refs.
- **Evidence:** [Cleanup receipt](reports/2026-09-20-worktree-cleanup.md); eight integrated checkouts removed, branches and stashes preserved.
- **Next action:** Preserve retained branches and stashes until separately reviewed.

### Task 04 — Schedule

- **State:** Integrated and deployed at `6aa275b6c5c7ae2138a530888093ef30230a4234`.
- **Dependencies / approval:** 02; current Matches/Rounds/Managers contracts.
- **Scope:** Own schedule composition and squad overlay; reuse Matches map; exclude lineup submission.
- **Completion check:** Thin pages, typed services/screens, preserved dates, filters and phone parity.
- **Evidence:** [Task 04 receipt](reports/task-04-schedule.md), Schedule `84e0721a` plus isolation fix `344ed0e8`; full verifier passes.
- **Next action:** Proceed with Task 05; preserve the Assistant adapter for Task 20 and frozen lineup command for Task 15. Vercel `dpl_8zRNoRJgWedSKVh9W2tpUUKvF5zz` is READY at the matching SHA; production visual review remains manual and the build-log connector was unavailable.

### Task 05 — Compare

- **State:** Integrated and pushed to main at `8bc0af22` (implementation `70c325c7`); Vercel deployment not inspected under the user's GitHub-only release instruction.
- **Dependencies / approval:** 04 or independently ready upstream contracts.
- **Scope:** Own comparisons, full/lite APIs and screens; reuse Managers/Rounds/Standings/Market.
- **Completion check:** Same selections and responses; retained HeadToHeadCard has its proper owner.
- **Evidence:** [Task 05 receipt](reports/task-05-compare.md); full/lite consumers and access/cache policy traced.
- **Next action:** Task 06 may proceed; retain the Assistant adapter until Task 20. Full verification and 9/9 browser cases passed before integration.

### Task 06 — Dashboard data

- **State:** Verified and fast-forward integrated into local main at `700b727b` (structure `2b59bff0`, separate cache correction `700b727b`), from `c184bee7`.
- **Dependencies / approval:** Owning domain contracts; 02.
- **Scope:** Assign remaining analytics, aggregate services and API handlers; no UI redesign.
- **Completion check:** No duplicate domain calculations; personal reads retain private caching.
- **Evidence:** [Task 06 receipt](reports/task-06-dashboard-data.md); eleven remaining APIs and page data reads use feature contracts. Full verification and 18/18 browser checks passed. Three accepted manager APIs remain unchanged.
- **Next action:** Task 07 screen ownership; retain News/Home/Assistant compatibility adapters until their assigned tasks. GitHub publication is checked separately from this local integration record; Vercel inspection is not required for this release.

### Task 07 — Dashboard screens

- **State:** Verified and fast-forward integrated into local main at `c4c55057`, implementation `6bc97fb6`, rebased onto `f47e2a65`; prepared for GitHub publication.
- **Dependencies / approval:** 06.
- **Scope:** Move desktop/phone composition, cards and loading orchestration.
- **Completion check:** Thin pages; existing loading order, content and interaction preserved.
- **Evidence:** [Task 07 receipt](reports/task-07-dashboard-screens.md); original desktop/phone references, unchanged card implementations, typed screens and protected page adapters.
- **Next action:** Publish the verified integration. Combined-source verification passed (2,437 tests, 251 focused tests, 18/18 browser cases). News ownership remains Task 08; it has not started. Vercel verification is separate.

### Task 08 — News

- **State:** Verified and fast-forward integrated into local main at `69dfa07f`, rebased onto `4929e035`; GitHub publication accompanies this receipt. Production deployment is not verified.
- **Dependencies / approval:** 02; existing ingestion boundaries.
- **Scope:** Own feed retrieval, parsing, validation and existing HTTP contracts; no provider redesign.
- **Completion check:** Typed reusable News read contract with original ordering/error behavior.
- **Evidence:** [Task 08 receipt](reports/task-08-news.md); News widgets/service, Market/Matches contracts and original browser references.
- **Next action:** Task 09 Home; completed and integrated at `fd424956`.

### Task 09 — Home

- **State:** Integrated into main at `fd424956`.
- **Dependencies / approval:** 08 plus Rounds/Market/Managers contracts.
- **Scope:** Own feed aggregation and screens; no new feed functionality.
- **Completion check:** Same activity/filters/pagination; last-round adapters retired where unused.
- **Evidence:** [Task 09 receipt](reports/task-09-home.md); Home activity/summary/landing contracts and original-screen references. Full verify (2,505 tests) and 190 browser cases pass.
- **Next action:** Task 10 Season Review data; completed and integrated at `c28481b2`.

### Task 10 — Season Review data

- **State:** Integrated into main at `c28481b2`.
- **Dependencies / approval:** 02; separation from product PR 29.
- **Scope:** Own existing pure engines, artifacts and read orchestration; assign generation commands to 21.
- **Completion check:** Unchanged calculations/artifact formats with typed, tested contracts.
- **Evidence:** [Task 10 receipt](reports/task-10-season-review-data.md); Season Review services, engines, queries, and boundary tests pass.
- **Next action:** Task 11 Season Review screens; completed and integrated at `0b001b17`.

### Task 11 — Season Review screens

- **State:** Integrated into main at `0b001b17`.
- **Dependencies / approval:** 10.
- **Scope:** Own existing pages, sections and presentation, excluding new simulator/product plans.
- **Completion check:** Same desktop/phone output consuming feature models.
- **Evidence:** [Task 11 receipt](reports/task-11-season-review-screens.md); Season Review screens, page adapters, architecture policy, and boundary tests pass.
- **Next action:** Task 12 Sensitive-operation inventory; completed and integrated at `b678cd14`.

### Task 12 — Sensitive-operation inventory

- **State:** Integrated into main at `b678cd14` (commit `3f2a9881`).
- **Dependencies / approval:** 02; read-only inspection.
- **Scope:** Enumerate DB reads, provider reads and writes across every method/action.
- **Completion check:** Per-operation matrix: identity, permission, credential boundary, cache, retry, side effect, failure and reconciliation.
- **Evidence:** [Task 12 receipt](reports/task-12-sensitive-operation-inventory.md); 16 operations inventoried across provider mutations, private reads, credentials, DB writes, and AI providers.
- **Next action:** Task 13 Provider boundaries (next active implementation milestone).

### Task 13 — Provider boundaries

- **State:** Integrated into main at `19531f1f`.
- **Dependencies / approval:** 12; explicit security/scope approval.
- **Scope:** Introduce only needed feature adapters around current HTTP/credential infrastructure.
- **Completion check:** Separate read/command contracts, filtered outputs and reviewed retry/uncertain-outcome policy.
- **Evidence:** [Task 13 receipt](reports/task-13-provider-boundaries.md); typed boundaries, query/command separation, fail-closed mutations, zero secret leakage, 27 boundary tests pass.
- **Next action:** Proceed with Task 14 Lineup reads.

### Task 14 — Lineup reads

- **State:** Integrated into main at `b40d9256`.
- **Dependencies / approval:** 12–13; scoped approval.
- **Scope:** Own live provider reads, safe models and related composition; preserve manager squad contract.
- **Completion check:** Private no-store policy and account isolation tested; no credential leakage.
- **Evidence:** [Task 14 receipt](reports/task-14-lineup-reads.md); typed SafeLineupResponse, lineupReadService with executeUserProviderQuery, canary redaction, schedule freeze preserved.
- **Next action:** Proceed with Task 15 Lineup commands.

### Task 15 — Lineup commands

- **State:** Integrated into main at `098bb0c9`.
- **Dependencies / approval:** 14; command approval.
- **Scope:** Own lineup submission; preserve auth and external behavior.
- **Completion check:** Mocked success/failure/uncertain outcomes and deliberate reconciliation; no blind retries.
- **Evidence:** [Task 15 receipt](reports/task-15-lineup-commands.md); lineupCommandService with executeUserProviderCommand, Zod schema validation, fail-closed policy, /api/users/lineup unfrozen.
- **Next action:** Proceed with Task 16 Private Market reads.

### Task 16 — Private Market reads

- **State:** Planned; approval gate.
- **Dependencies / approval:** 12–13; scoped approval.
- **Scope:** Migrate only private account/offer reads confirmed in source; exclude public analytics and mutations.
- **Completion check:** Private typed models isolated from public cache/contracts.
- **Evidence:** Public slice already merged in PR 38.
- **Next action:** Inventory actual operations; document no-op only if absence is proven.

### Task 17 — Market commands

- **State:** Planned; approval gate.
- **Dependencies / approval:** 16; command approval.
- **Scope:** Own selling, withdrawing and offer decisions, not provider behavior changes.
- **Completion check:** Permission, redaction, partial local-update failure and uncertain provider outcomes tested.
- **Evidence:** Existing marketActionsService retained.
- **Next action:** Pin each existing command and local reconciliation behavior.

### Task 18 — Accounts / Settings

- **State:** Planned; approval gate.
- **Dependencies / approval:** 12–13; scoped approval.
- **Scope:** Own account orchestration/screens; retain reviewed Auth.js and encrypted credential infrastructure.
- **Completion check:** No session/token/storage regression; explicit trusted infrastructure contracts.
- **Evidence:** Plaintext credential fallback already removed on main.
- **Next action:** Inventory linking/password/settings boundaries; never restore old fallback.

### Task 19 — Hoopgrid

- **State:** Planned; approval gate.
- **Dependencies / approval:** 12; explicit behavior/security decisions.
- **Scope:** Separate challenge reads, creation and guesses, including test/cheatsheet routes.
- **Completion check:** Side-effecting GET and answer privacy deliberately handled; no silent protocol change.
- **Evidence:** Security gate.
- **Next action:** Pin all routes/actions and resolve mixed-read/write decisions.

### Task 20 — Assistant

- **State:** Planned; approval gate.
- **Dependencies / approval:** 12–13 plus owning domain contracts.
- **Scope:** Own context, conversations, provider calls and screens; no paid/production validation.
- **Completion check:** Ownership, streaming/cancellation, privacy and failure contracts preserved.
- **Evidence:** Legacy Market/manager adapters may still be consumed.
- **Next action:** Trace methods and use synthetic provider responses.

### Task 21 — Other actions

- **State:** Planned; approval gate where sensitive.
- **Dependencies / approval:** 12 plus 10 and command inventory.
- **Scope:** Close discovered generation/submission/other writes, not new product features.
- **Completion check:** Every command owned and tested, or explicitly justified as infrastructure.
- **Evidence:** Discovery required; absence is not assumed.
- **Next action:** Assign each discovered action a scoped implementation or retention decision.

### Task 22 — Infrastructure / cache lifecycle

- **State:** Planned.
- **Dependencies / approval:** Read/command contracts stable; inventory can start earlier.
- **Scope:** Review DB infrastructure, sync, scripts, locks and invalidation; not a wholesale sync rewrite.
- **Completion check:** Retained infrastructure has ownership/rationale; identity/season cache keys and invalidation verified.
- **Evidence:** Task 01 superseded sync histories.
- **Next action:** Audit current main only; no production sync or schema operations.

### Task 23 — Shell / search interactions

- **State:** Planned; presentation migration is now an early UI adoption slice.
- **Dependencies / approval:** Stable domain access contracts; 18 only where account/auth behavior is changed.
- **Scope:** Migrate sidebar, top bar, footer/mobile navigation and shared shell presentation onto the new UI foundation while preserving routing, authentication, search-data ownership and PWA behavior. Search/control behavior stays separately bounded.
- **Completion check:** Acyclic reusable composition, preserved keyboard/focus/mobile/safe-area behavior, and no auth/provider ownership drift.
- **Evidence:** Search data boundary already merged; UI foundation evidence is recorded in Task 24.
- **Next action:** After UI rollout hardening, inventory shell chrome and migrate it as the first production consumer. Do not re-migrate Search SQL or change auth behavior as part of the visual slice.

### Task 24 — Shared UI / tokens

- **State:** Foundation integrated and hardened; ready for production adoption.
- **Dependencies / approval:** Broad legacy adoption still depends on the owning shell/domain boundary; foundation work itself is additive.
- **Scope:** Maintain one semantic token system and domain-independent shared foundation. Integrated work includes token extraction, Surface/composable Card, system/dark/light runtime capability and core primitives. Do not bulk-restyle legacy pages or create a universal-card abstraction.
- **Completion check:** Foundation contracts remain server-compatible and accessible; legacy screens default to the dark compatibility baseline until migrated; shared compositions are extracted only from demonstrated shell/page reuse.
- **Evidence:** PR #40 design direction; `f868a602` token foundation; `222ae61b` Surface/Card; PR #43 (`55765dfe`) UI-01T; PR #44 (`665fd1d7`) UI-01B.
- **Next action:** Use Task 23 shell/chrome as the first production consumer while extracting UI-01C compositions from real reuse.

### Task 25 — Exhaustive ownership closure

- **State:** Planned.
- **Dependencies / approval:** 04–24; review upstream gaps earlier when needed.
- **Scope:** Enumerate all runtime entrypoints/modules; resolve Team/Player leftovers and remove obsolete adapters/exceptions.
- **Completion check:** Zero unassigned migration work; no temporary debt; retained infrastructure/protocol URLs justified.
- **Evidence:** Task 01 residual Team/Player work and test candidates.
- **Next action:** Review residual boundaries before affected consumers; close all final exceptions.

### Task 26 — Full regression acceptance

- **State:** Planned.
- **Dependencies / approval:** 25 and exact combined candidate.
- **Scope:** Run full checks and complete affected API/security/desktop/mobile/Linux matrices.
- **Completion check:** Required checks pass; missing coverage and known defect decisions resolved; no masked regressions.
- **Evidence:** Historical receipts are inputs, not new acceptance.
- **Next action:** Include opt-in Market fixture; preserve original screenshot provenance.

### Task 27 — Release / final reconciliation

- **State:** Planned; release gate.
- **Dependencies / approval:** 26; explicit push/deploy approval.
- **Scope:** Integrate approved history, verify CI/deployment and preservation; no unapproved production writes.
- **Completion check:** Main/origin/deployed SHA agree, smoke/log checks pass and final receipt closes every task.
- **Evidence:** Not inferred from prior PR merges.
- **Next action:** Obtain release authority; keep unavailable verification explicitly pending.

Tasks can be combined into a bounded PR when dependencies and review scope permit; IDs remain stable.
All read-domain scopes (Tasks 04–11), the sensitive-operation security inventory (Task 12), provider boundaries (Task 13), lineup reads (Task 14), and lineup commands (Task 15) are merged into `main`. The next domain milestone is **Task 16 — Private Market reads**. In the UI migration track, UI-01A, UI-01T, and UI-01B are integrated; UI-01H rollout hardening is complete after PR #46, followed by the **Application Shell** migration as the first production consumer, before demand-driven **UI-01C — Shared Compositions** and **UI-02 — Interactive Controls & Overlays**.

## Standard acceptance for implementation tasks

Before a move: inventory actual routes/methods/actions, transitive callers, database/provider ownership,
identity precedence, validation quirks, access/cache policy and observable UI/API behavior. Establish
a relevant baseline and original visual references when presentation moves.

Before calling an implementation verified: run the relevant typecheck, focused boundary/mapper/service/
validation/HTTP/command tests, full suite, lint, production build, graph enforcement and diff checks.
Database-backed models require offline schema metadata and Drizzle checks. Follow [testing](../contributing/testing.md).
Compare affected desktop/phone states; retain wider viewport/Linux gaps explicitly for 26.
Use synthetic databases and mocked providers; no production mutations, credentials in fixtures or
snapshot updates to hide regressions. Previously accepted code is rechecked for affected contracts,
not reimplemented merely because a final acceptance task remains.

Each provider operation in 12–21 must specify: read or command, authenticated account/authorization,
server-only credential access, request validation, redacted typed response, cache policy, retry safety,
uncertain outcome and local reconciliation/invalidation. Service decomposition alone is not acceptance.
An unsafe existing behavior needs an explicit correction decision, not silent preservation or hardening.

## Task 01 finding-to-owner register

| Finding                                                                       | Required disposition                                                                                   | Owner / closure evidence                                                                |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Five feature integration worktrees and three integrated maintenance worktrees | Eligible for approved cleanup only after fresh ancestry and ignored-artifact preservation              | 03; removal receipt, not blanket deletion                                               |
| Saved campaign `68781e86`, predecessor `1e889c8e`                             | Preserve; complete Market component tree already identical to main, including checkpoint Q             | 25 reviews remaining unique changes; no Market restart                                  |
| Shared Player form leaf/catalogue-facts/roster services                       | Review need for acyclic ownership, preserving current season and DNP contracts                         | 25, before affected consumer changes where needed; source comparison and contract tests |
| Team detail orchestration/records and tests                                   | Assess query-to-service responsibility correction on current schema                                    | 25; deliberate service/query boundary and compatibility evidence                        |
| Missing fixture-selector and Player form regression tests                     | Review assertion relevance; add useful coverage without restoring obsolete fixture data                | 25–26                                                                                   |
| Old completion guide/campaign inventory/C01 receipt                           | Preserve historical source; new Task IDs and current scope here supersede its scheduling               | 02 delivered by this tracker; never restore old schema/fallback assumptions             |
| `refactor/ui-token-foundation` and `origin/docs/ui-foundation-v1`             | Unique implementation/design, not yet accepted or merged                                               | 24                                                                                      |
| Original visual-baseline worktrees                                            | Preserve provenance; different PNGs do not imply originals should overwrite current references         | 26; 03 must retain required evidence                                                    |
| Missing Linux/original references and broader viewport verification           | Enumerate exact feature/scenario gaps from tests/receipts; close before final acceptance               | 26; include populated Market opt-in scenario and CI coverage                            |
| Market phone `/market/bids` non-iterable duel-data defect                     | Known preserved pre-existing error; request scoped behavior decision, not an architectural cleanup fix | 25 coordinates decision; 26 cannot claim error-free acceptance while unresolved         |
| Remaining global adapters and auth graph exceptions                           | Track actual callers and retirement condition; no broad exemptions or fake domain wrappers             | Owning feature tasks, 18/22, then 25                                                    |
| Season Review v5 simulator PR #29 and inherited PWA/archive/sync history      | Separate product work; preserve, do not absorb into existing Season Review migration                   | Outside migration; 03 cannot discard unique history                                     |
| New unscored season-prediction design at `e29cc86e`                           | Separate future product; not existing Predictions feature                                              | Outside migration; retained                                                             |
| Superseded sync history / stash 0 (`be737523`)                                | Historical recovery; no bulk restoration of old database/provider code                                 | Retain; 22 may consult after current-schema review                                      |
| Stash 1 (`a3eda423`) asks for 13 recent rounds, current UI uses 12            | Separate product decision, not an adapter or migration fix                                             | Outside migration; retained                                                             |
| Plaintext credential fallback already removed                                 | Current encrypted store is authoritative; historical observation gate is obsolete                      | 18 preserves current security contract                                                  |

Outside-migration findings have a preservation disposition, not a requirement to merge unrelated
product work before architecture completion.

## Historical identifiers — not new task numbers

| Historical identifier                                  | Meaning                                 | Current tracking                                    |
| ------------------------------------------------------ | --------------------------------------- | --------------------------------------------------- |
| Worker 001                                             | Standings pilot                         | Merged scope above; historical review sequence only |
| Worker 002 / C02                                       | Tournaments                             | Merged PR 35                                        |
| Worker 003 / C03                                       | Predictions                             | Merged PR 36                                        |
| Worker 004 / C04                                       | Playoffs                                | Merged PR 37                                        |
| Worker 005 / old campaign C01 / integrated receipt C06 | Managers remaining reads                | Merged PR 39                                        |
| Worker 007 / C05                                       | Public Market                           | Merged PR 38                                        |
| Worker 006                                             | Schedule                                | Task 04                                             |
| Worker 009                                             | Compare                                 | Task 05                                             |
| Worker 008                                             | Dashboard                               | Tasks 06–07                                         |
| Worker 010                                             | Home/News                               | Tasks 08–09                                         |
| Worker 011 / old campaign C06                          | Season Review                           | Tasks 10–11; NOT Managers receipt C06               |
| Old campaign C11 / security gates                      | Sensitive flows                         | Tasks 12–21                                         |
| Old campaign C12 / C13 / C14 / C15                     | Infrastructure / UI / closure / release | Tasks 22 / 23–24 / 25–26 / 27                       |
| Worker 012                                             | Shell/adapters                          | Tasks 23–25                                         |

Historical assignments and checkpoint letters describe their original source ranges.
Read them as evidence only; current assignments must be refreshed from current main.
The [worker protocol](worker-protocol.md) and [security gates](security-gates.md) remain guardrails,
not independent queues. The [reconciliation report](reports/2026-09-20-reconciliation.md) remains
an immutable dated inventory; it is not rewritten to pretend these documentation changes were on main.

## Completion standard

Implementation closure requires every active entrypoint/module/action to have justified ownership,
no unassigned migration work, no obsolete implementation or unexplained temporary adapter, and complete
required validation. Permanent infrastructure and tested legacy HTTP URLs may remain with explicit rationale.
Release closure additionally requires the approved integration/deployment and final preservation evidence.
If discovery adds work, assign a task and close it; never silently narrow the objective.

Task 02 verification (2026-09-20): `npm run docs:check` passed for 96 notes, including formatting,
frontmatter, links and reachability. `git diff --check` passed. A read-only consistency check passed:
27 unique task IDs with all six required fields, five original receipt bodies unchanged,
Task 01 report/inventory unchanged, five PR merge SHAs ancestral to origin/main, docs-only changes,
and main equal to origin/main. The existing primary checkout's installed Prettier was used through
PATH; no dependencies or environment files were installed/copied. No application tests, build or
production checks were run for this documentation-only update. Delivery is the commit containing
this tracker on `docs/migration-tracker`; its exact SHA is reported in the handoff.
