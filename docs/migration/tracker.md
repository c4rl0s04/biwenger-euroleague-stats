---
title: Architecture migration master tracker
description: Authoritative remaining-task queue, merged-scope evidence and completion gates.
audience:
  - maintainer
  - agent
status: active
---

# Architecture migration master tracker

Last reconciled: 2026-09-20 against fetched `origin/main`
`1933e033434d5a35564b199705a40836f6ebed81`.
This is the authoritative task/status queue. The [overview](../architecture/migration-overview.md)
summarizes it; the [ledger](../architecture/migration-status.md) and receipts preserve evidence.
If newer code/history contradicts this checkpoint, refresh the evidence before acting.

Task 02 is documentation-only on `docs/migration-tracker`, in
`../biwengerstats-next-migration-tracker`, stacked on Task 01 report commit `143e7f27`.
Neither documentation commit is claimed merged or deployed. No current implementation, cleanup,
parallel dispatch, security change or release is authorized merely by a planned row.

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

PRs #35–39 are confirmed merged, not newly certified deployed by this tracker.
Older deployment receipts remain valid historical observations, not proof about today's production.

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

- **State:** Verified locally on `refactor/compare-read-architecture` (`70c325c7`), based on `6aa275b6`; not integrated or deployed.
- **Dependencies / approval:** 04 or independently ready upstream contracts.
- **Scope:** Own comparisons, full/lite APIs and screens; reuse Managers/Rounds/Standings/Market.
- **Completion check:** Same selections and responses; retained HeadToHeadCard has its proper owner.
- **Evidence:** [Task 05 receipt](reports/task-05-compare.md); full/lite consumers and access/cache policy traced.
- **Next action:** Review and integrate as its own release before Task 06; full verification and 9/9 browser cases passed. Retain the Assistant adapter until Task 20.

### Task 06 — Dashboard data

- **State:** Planned.
- **Dependencies / approval:** Owning domain contracts; 02.
- **Scope:** Assign remaining analytics, aggregate services and API handlers; no UI redesign.
- **Completion check:** No duplicate domain calculations; personal reads retain private caching.
- **Evidence:** Legacy batch 008; three manager APIs already migrated.
- **Next action:** Inventory remaining Dashboard APIs; leave accepted manager reads intact.

### Task 07 — Dashboard screens

- **State:** Planned.
- **Dependencies / approval:** 06.
- **Scope:** Move desktop/phone composition, cards and loading orchestration.
- **Completion check:** Thin pages; existing loading order, content and interaction preserved.
- **Evidence:** No current acceptance.
- **Next action:** Capture original views and migrate composition.

### Task 08 — News

- **State:** Planned.
- **Dependencies / approval:** 02; existing ingestion boundaries.
- **Scope:** Own feed retrieval, parsing, validation and existing HTTP contracts; no provider redesign.
- **Completion check:** Typed reusable News read contract with original ordering/error behavior.
- **Evidence:** Legacy batch 010.
- **Next action:** Trace ingestion versus read responsibilities.

### Task 09 — Home

- **State:** Planned.
- **Dependencies / approval:** 08 plus Rounds/Market/Managers contracts.
- **Scope:** Own feed aggregation and screens; no new feed functionality.
- **Completion check:** Same activity/filters/pagination; last-round adapters retired where unused.
- **Evidence:** Legacy batch 010.
- **Next action:** Inventory Home consumers and cache/identity rules.

### Task 10 — Season Review data

- **State:** Planned.
- **Dependencies / approval:** 02; separation from product PR 29.
- **Scope:** Own existing pure engines, artifacts and read orchestration; assign generation commands to 21.
- **Completion check:** Unchanged calculations/artifact formats with typed, tested contracts.
- **Evidence:** Legacy batch 011; not the new simulator.
- **Next action:** Inventory reads, scripts and action side effects.

### Task 11 — Season Review screens

- **State:** Planned.
- **Dependencies / approval:** 10.
- **Scope:** Own existing pages, sections and presentation, excluding new simulator/product plans.
- **Completion check:** Same desktop/phone output consuming feature models.
- **Evidence:** No current acceptance.
- **Next action:** Capture original output and move composition.

### Task 12 — Sensitive-operation inventory

- **State:** Planned.
- **Dependencies / approval:** 02; read-only inspection.
- **Scope:** Enumerate DB reads, provider reads and writes across every method/action.
- **Completion check:** Per-operation matrix: identity, permission, credential boundary, cache, retry, side effect, failure and reconciliation.
- **Evidence:** Security gates; no implementation approval implied.
- **Next action:** Inspect flows; propose bounded approvals for 13–21.

### Task 13 — Provider boundaries

- **State:** Planned; approval gate.
- **Dependencies / approval:** 12; explicit security/scope approval.
- **Scope:** Introduce only needed feature adapters around current HTTP/credential infrastructure.
- **Completion check:** Separate read/command contracts, filtered outputs and reviewed retry/uncertain-outcome policy.
- **Evidence:** No current acceptance.
- **Next action:** Pin existing behavior; request decisions before observable corrections.

### Task 14 — Lineup reads

- **State:** Planned; approval gate.
- **Dependencies / approval:** 12–13; scoped approval.
- **Scope:** Own live provider reads, safe models and related composition; preserve manager squad contract.
- **Completion check:** Private no-store policy and account isolation tested; no credential leakage.
- **Evidence:** Existing lineupService retained.
- **Next action:** Freeze current input/output contracts and mock provider reads.

### Task 15 — Lineup commands

- **State:** Planned; approval gate.
- **Dependencies / approval:** 14; command approval.
- **Scope:** Own lineup submission; preserve auth and external behavior.
- **Completion check:** Mocked success/failure/uncertain outcomes and deliberate reconciliation; no blind retries.
- **Evidence:** No current acceptance.
- **Next action:** Review request validation and write permission before extraction.

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

- **State:** Planned.
- **Dependencies / approval:** Domain access contracts; 18 where auth is involved.
- **Scope:** Own layouts/navigation/selectors/search UI/providers/PWA shell; no redesign.
- **Completion check:** Acyclic reusable composition, preserved keyboard/focus/mobile behavior.
- **Evidence:** Search data boundary already merged.
- **Next action:** Inventory shared controls; do not re-migrate Search SQL.

### Task 24 — Shared UI / tokens

- **State:** Planned.
- **Dependencies / approval:** 23 and domain component ownership.
- **Scope:** Review saved UI foundation and shared/domain controls; no cosmetic redesign or universal-card abstraction.
- **Completion check:** Justified tokens/controls, domain-owned cards; unchanged appearance verified.
- **Evidence:** Unmerged 2ebf1fee and related UI design branch.
- **Next action:** Reconcile unique token work against current main before adoption.

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
If cleanup approval is not available, preserve the worktrees; it does not require restarting accepted
features or granting unrelated authority. The next implementation feature is **Task 04 Schedule**,
after a pinned assignment; the immediate next administrative task is **Task 03**, subject to approval.

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
