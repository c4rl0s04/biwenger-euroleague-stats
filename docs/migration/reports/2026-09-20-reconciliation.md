---
title: Task 01 — migration starting-point reconciliation
description: Preserved Git inventory, synchronized main and disposition of historical migration work.
audience:
  - maintainer
  - agent
status: active
---

# Task 01 — synchronize and reconcile

Inspection date: 2026-09-20. This report records Git/source evidence, not a new application
test run or production verification. The [machine-readable inventory](2026-09-20-reconciliation.json)
contains full SHAs, every local branch/worktree, remote refs, stash path inventories and file-blob comparisons.

## Outcome and scope

- Primary main was clean at `72fe5d62881f2e27dd24c84cf048848a39ebec39`, 0 commits ahead / 61 behind.
- Fetched origin without pruning. Fast-forwarded main with `git merge --ff-only origin/main`.
- Local main, fetched origin/main and live remote main now agree at
  `1933e033434d5a35564b199705a40836f6ebed81` (Managers PR #39).
- Existing inventory: 65 local branches, 17 worktrees and two stashes. Added only
  `docs/migration-reconciliation` in sibling `../biwengerstats-next-migration-reconciliation`.
- All existing checkouts are clean for tracked and nonignored untracked files.
  Ignored files/directories exist in many checkouts: clean Git status does not authorize deleting them.
  Their contents, including environment files, were not opened or copied.
- No old branch was merged, rebased or deleted; no stash applied/dropped; no push or deployment.
  Updating main checked out already-published application commits; no new application edits were made.
- Task 02 (global status update) and Task 03 (approved cleanup) remain separate. This report does not
  authorize resuming the old campaign or implementing the entire migration.

An initial expanded ignored-file enumeration exceeded the subprocess output buffer. A bounded
directory-level enumeration replaced it; no files changed. Ignored group counts are not file counts
or backups. The initial primary SHA is recorded above; the inventory records post-fast-forward refs.

## Already integrated work

Git ancestry proves the local integration tips for Tournaments, Predictions, Playoffs, Market and
Managers are contained in main. GitHub confirms PRs #35, #36, #37, #38 and #39 merged.
The local Managers, Market and Predictions tips lag their remote branch's final documentation/test
commits, but those newer commits are also on main. Do not merge the older worktree tips again.

Repository hygiene, Supabase hardening and user-season membership worktree tips are also ancestors
of main. These eight non-primary integrated worktrees are cleanup candidates, not instructions to
remove them. Check ignored files and obtain Task 03 approval first.

Current [migration overview](../../architecture/migration-overview.md) and worker queue have stale
pre-merge labels. In particular Managers is merged, not awaiting review. Task 02 should reconcile
the overview, ledger, queue and receipts without rewriting historical evidence as new verification.

## Unique or historical work: exact disposition

### Old architecture campaign — preserve; do not merge wholesale

Source: `safety/architecture-completion-wip-2026-09-17` at `68781e86`;
its predecessor `refactor/architecture-completion` remains at `1e889c8e`.
Across added/modified paths since the merge base: 198 are byte-identical to main,
106 differ and 20 are absent at the same path. These are path comparisons, not a claim
that all absent files represent missing behavior. Deleted/renamed legacy paths must be interpreted
with the actual integrated feature replacements.

The complete `src/features/market/components` tree has zero diff against main.
Thus the saved aggregate/chart TSX conversion and its component tests are already recovered.
Do not re-execute old checkpoint Q or its acceptance workflow as missing implementation.
Current Market fixtures/queries were reconciled to the newer schema and populated trends coverage
was added by PR #38; the historical branch is not the authoritative application base.

The following residual architecture work is genuinely different and needs a bounded review on
current main, not a blind cherry-pick:

| Candidate                      | Source evidence                                                                                                  | Current main                                                                                                             | Disposition                                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Shared Player form leaf        | Nine `src/features/player-form/*` files, catalogue-facts and roster services in saved campaign                   | Players query adapter still delegates to `src/lib/db/queries/core/playerForm.ts`; Teams also consumes shared legacy form | Review acyclic shared ownership and consumer contracts during final adapter/data-boundary closure. Preserve current season/DNP fixes. |
| Team detail orchestration      | `team-profile-details.service.ts`, `team-profile-facts.ts` and contract test                                     | `team-profile.query.ts` still combines detail SQL with match counts, playoff probability and standings                   | Review moving orchestration above queries against the current schema. Not an unmigrated Team screen.                                  |
| Additional regression coverage | `scripts/e2e/fixture-scenarios.test.mjs` and `src/features/players/server/services/player-form.contract.test.ts` | Exact paths absent                                                                                                       | Review assertions against current behavior before porting; do not restore obsolete fixture assumptions.                               |
| Historical planning/evidence   | campaign execution/inventory, completion plan, old C01 receipt                                                   | Not on main at those paths                                                                                               | Retain evidence; Task 02 should write current tracking, not adopt old package statuses.                                               |

Older source contains retired global seasonal-column fallbacks; current source uses season tables
and newer database/credential contracts. These incompatibilities make wholesale restoration unsafe.

### UI foundation — unique implementation for a later task

`refactor/ui-token-foundation` at `2ebf1fee` has 11 unmatched commits.
Its changes are limited to the architecture index/layering link, `ui-foundation-v1.md`,
`src/app/globals.css`, and new `src/styles/tokens/base-tokens.css` and
`semantic-tokens.css`. It separates raw color/radius values from semantic UI tokens.
Main has not integrated these changes. Review and validate in the shared-UI/token task.
The remote-only `origin/docs/ui-foundation-v1` is earlier related design work; retain it too.
No visual compatibility or production readiness is certified by this inventory.

### Saved plans — historical or separate product scope

- `docs/migration-completion-plan` at `6ad78eb8` and safety tip `8e9cbe2e`:
  completion plan plus guide. They still refer to an obsolete main/checkpoint and credential
  fallback state. Preserve, extract applicable acceptance criteria, and replace stale scheduling
  with the newly agreed task queue in Task 02.
- `safety/season-predictions-plan-wip-2026-09-17` at `e29cc86e`:
  a new unscored season-prediction product design, with multi-select and reveal/locking decisions.
  It is not the existing Predictions migration. Retain outside migration scope.
- The unchanged `docs/season-predictions-plan` branch itself points to integrated `354f66e1`;
  the unique document is on the safety branch, not that old branch.

### Visual baselines — retain original provenance

Tournaments, Predictions and Playoffs baseline histories contain 12, 18 and 23 respectively
byte-identical PNG paths also present on main (counts include inherited earlier-feature images).
Market baseline history has 28 identical and 12 changed PNG paths versus main. Preserve the
original branch and provenance; changed fixture/schema references are not permission to replace
current images or delete originals. The JSON lists every compared path/blob.
None of these baseline worktrees is an unfinished feature implementation or a branch to merge.

### Non-migration branch history — keep separate

- `codex/season-review-v5-aggregates` at `098ca876`: four unique simulator/artifact/UI
  commits, open PR #29. Product expansion, not structural Season Review migration.
- `feature/mobile-pwa`: five patch-equivalent commits and four unmatched commits;
  the unmatched non-merge history is the same four Season Review v5 commits.
- `chore/archive-euroleague-legacy-2025-26`: six patch-equivalent and the same four
  unmatched Season Review commits. Do not mistake inherited simulator work for missing PWA/sync work.
- `refactor/sync-pipeline`: nine patch-equivalent commits, the four simulator commits,
  plus old `660d75a4`. Its sync-directory changes match integrated `fe5dff58`
  (path-scoped range-diff equality and zero sync-directory tree diff); main has substantial later
  sync changes. Retain historical source; do not restore the obsolete pipeline or infer whole-commit equivalence.

Patch-ID equivalence ignores some formatting and does not prove semantic completeness.
An unmatched commit can be superseded or partially recovered. Counts include shared history
and are not additive across branches. No non-ancestor branch is marked safe to delete.

## Stashes — both preserved exactly

| Stash       | SHA                                        | Contents and decision                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stash@{0}` | `be7375232acb93230c8ecd253c5f224b2e95b962` | 31 tracked-file deltas plus 30 saved untracked files: old official-game routes, provider integration, schema/sync work and documentation. One tracked and eleven saved-untracked paths match main exactly; others differ or moved. Main has newer official-data/season implementations. Keep as historical recovery material; any proposed restoration requires a file-level current-schema review. Never apply the entire stash. |
| `stash@{1}` | `a3eda4235e1b88c0233bd8ed1995b0c705849bef` | One-line RecentRoundsCard change from 10 to 13 rows. Main currently uses 12. This is a distinct product-behavior choice, not architecture work; retain pending explicit decision.                                                                                                                                                                                                                                                 |

Stash names/descriptions are not evidence of contents; parent-tree differences and the third
parent's file inventory were inspected. No stash was executed, applied or deleted.
Potentially sensitive file bodies were excluded from output; the inventory contains paths and hashes only.

## All local worktrees

Paths below are siblings under `/Users/carlosandreshuete/Documents/Projects`.
All had empty tracked/nonignored-untracked status at inspection. Ignored local artifacts remain untouched.

| Checkout                                            | Tip        | Disposition                                                                          |
| --------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| `biwengerstats-next`                                | `1933e033` | Current integration base; retain.                                                    |
| `biwengerstats-next-architecture-completion`        | `68781e86` | Mixed recovered migration history; review residual Team/Player boundaries, preserve. |
| `biwengerstats-next-managers-remaining-reads`       | `0115754b` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.     |
| `biwengerstats-next-market-reads`                   | `d6e28c93` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.     |
| `biwengerstats-next-market-visual-baseline`         | `a4d105cf` | Historical original reference; retain, never merge wholesale.                        |
| `biwengerstats-next-migration-completion-plan`      | `8e9cbe2e` | Historical completion plan; reconcile into Task 02, preserve source.                 |
| `biwengerstats-next-migration-reconciliation`       | `1933e033` | This report only; local, not integrated.                                             |
| `biwengerstats-next-playoffs-integration`           | `65e0f89d` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.     |
| `biwengerstats-next-playoffs-visual-baseline`       | `fc053343` | Historical original reference; retain, never merge wholesale.                        |
| `biwengerstats-next-predictions-integration`        | `b58f260b` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.     |
| `biwengerstats-next-predictions-visual-baseline`    | `2e738b58` | Historical original reference; retain, never merge wholesale.                        |
| `biwengerstats-next-repository-hygiene`             | `214015ef` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.     |
| `biwengerstats-next-season-predictions-plan`        | `e29cc86e` | Separate product design; retain outside migration.                                   |
| `biwengerstats-next-supabase-data-access-hardening` | `66fdaba9` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.     |
| `biwengerstats-next-tournament-visual-baseline`     | `afb26b3b` | Historical original reference; retain, never merge wholesale.                        |
| `biwengerstats-next-tournaments-integration`        | `cecbd784` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.     |
| `biwengerstats-next-ui-token-foundation`            | `2ebf1fee` | Unique UI foundation; review in shared-UI task.                                      |
| `biwengerstats-next-user-season-membership`         | `7f433d0e` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.     |

## All local branches

This table captures the 65 existing branches plus this new report branch at its creation point.
The report branch advances when this report is committed; other branch tips stay unchanged except main.
Full hashes and patch-equivalence counts are in the JSON inventory.

| Branch                                            | Tip        | Classification / next action                                                          |
| ------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `chore/agent-workflow-setup`                      | `2c9370da` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `chore/architecture-reconciliation`               | `832b4c75` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `chore/archive-euroleague-legacy-2025-26`         | `b7bf6414` | Patch-equivalent changes plus separate simulator history; retain, no automatic merge. |
| `chore/feature-graph`                             | `3a4fcc97` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `chore/formatting-baseline`                       | `450ee236` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `chore/market-visual-baseline`                    | `a4d105cf` | Historical original reference; retain, never merge wholesale.                         |
| `chore/playoffs-visual-baseline`                  | `fc053343` | Historical original reference; retain, never merge wholesale.                         |
| `chore/predictions-visual-baseline`               | `2e738b58` | Historical original reference; retain, never merge wholesale.                         |
| `chore/repository-hygiene`                        | `214015ef` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `chore/security-integration-deps`                 | `20e3b44b` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `chore/supabase-data-access-hardening`            | `66fdaba9` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `chore/tournament-visual-baseline`                | `afb26b3b` | Historical original reference; retain, never merge wholesale.                         |
| `codex/safety-hardening`                          | `c0d304fd` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `codex/season-aware-sync-users`                   | `d0e2de6b` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `codex/season-config-hardening`                   | `acec96ff` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `codex/season-freeze-price-source`                | `a83087db` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `codex/season-review-v5-aggregates`               | `098ca876` | Separate unmerged product feature (PR 29); not migration.                             |
| `docs/migration-completion-plan`                  | `6ad78eb8` | Historical completion plan; reconcile into Task 02, preserve source.                  |
| `docs/migration-reconciliation`                   | `1933e033` | This report only; local, not integrated.                                              |
| `docs/season-predictions-plan`                    | `354f66e1` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `docs/team-source-links`                          | `b97ef625` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `feature/biwenger-credential-encryption`          | `dd2476dc` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `feature/docs-vault-restructure`                  | `387eaece` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `feature/documentation`                           | `d0e2de6b` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `feature/home-feed-milestones`                    | `bb9782a2` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `feature/mobile-home-feed`                        | `0fd747b9` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `feature/mobile-native-experience`                | `d761e6d9` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `feature/mobile-pwa`                              | `45162981` | Patch-equivalent changes plus separate simulator history; retain, no automatic merge. |
| `feature/transfer-value-comparison`               | `21255315` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `fix/biwenger-security-containment`               | `4c789561` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `fix/mobile-home-header-actions`                  | `335536a9` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `fix/mobile-home-polish`                          | `2947f7f8` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `fix/production-season-readiness`                 | `df5ba009` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `fix/pwa-navigation-feedback`                     | `7b33468f` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `fix/pwa-skip-link`                               | `1677dd67` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `fix/session-read-cache-policy`                   | `376814b6` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `integration/managers-remaining-reads-migration`  | `0115754b` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `integration/market-reads-migration`              | `d6e28c93` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `integration/playoffs-migration`                  | `65e0f89d` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `integration/predictions-migration`               | `b58f260b` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `integration/tournaments-migration`               | `cecbd784` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `main`                                            | `1933e033` | Current integration base; retain.                                                     |
| `refactor/architecture-completion`                | `1e889c8e` | Mixed recovered migration history; review residual Team/Player boundaries, preserve.  |
| `refactor/feature-server-guards`                  | `4cf8446d` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/manager-contributors`                   | `07037d56` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/manager-profile-completion`             | `175c25b9` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/managers-read-architecture`             | `8aedb1c3` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/matches-feature-architecture`           | `4dd6f3ab` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/official-game-contracts`                | `48b0bcbb` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/players-feature-architecture`           | `7712910f` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/profile-dependencies-batch`             | `1a2c0c68` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/read-foundations-batch`                 | `9daf7486` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/reference-entrypoints`                  | `22df97be` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/round-calendar`                         | `e3919a4d` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/search-feature-architecture`            | `251175d8` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/standings-head-to-head`                 | `d35451ed` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/standings-read-architecture`            | `eb12e4dc` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/sync-pipeline`                          | `51b686ae` | Mostly superseded sync plus separate simulator history; retain, no automatic merge.   |
| `refactor/team-profile-architecture`              | `a9f0dc92` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/tournament-read-core`                   | `40e77f66` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `refactor/ui-token-foundation`                    | `2ebf1fee` | Unique UI foundation; review in shared-UI task.                                       |
| `refactor/user-season-membership`                 | `7f433d0e` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |
| `safety/architecture-completion-wip-2026-09-17`   | `68781e86` | Mixed recovered migration history; review residual Team/Player boundaries, preserve.  |
| `safety/migration-completion-plan-wip-2026-09-17` | `8e9cbe2e` | Historical completion plan; reconcile into Task 02, preserve source.                  |
| `safety/season-predictions-plan-wip-2026-09-17`   | `e29cc86e` | Separate product design; retain outside migration.                                    |
| `safety/sync-season-config-wip-2026-09-17`        | `72fe5d62` | Integrated by ancestry; cleanup candidate after approval and ignored-file check.      |

## Remote-only refs

The inventory also records 46 origin refs (including origin/HEAD). Local counterparts use the
classification above. Additional refs are accounted for as follows:

- Five Dependabot branches: separate open dependency updates, excluded from migration.
- `origin/docs/ui-foundation-v1`: related unmerged UI design, retain for UI-task reconciliation.
- `origin/refactor/season-data-model` and `origin/refactor/drop-deprecated-columns`:
  GitHub reports PRs #31/#32 merged with commits `26c3d499`/`30e61084` present in main;
  the remote tips are not ancestors. Treat as squash/reworked-history evidence, not new missing
  feature migrations or automatic deletion approval.
- `origin/docs/sync-current-architecture-2026-09-16`, `origin/fix/ci-pipeline-repairs`,
  `origin/fix/season-data-integrity`, `origin/refactor/sync-modernization`: ancestors of main.
- `origin/HEAD` is a symbolic remote default, not a separate task.

## Validation and next action

Git fetch, clean-state checks, ancestry/patch comparisons and fast-forward succeeded.
A second live remote SHA check still matched main. Full documentation check passed (95 notes),
scoped Markdown/JSON formatting passed, and `git diff --check` passed. A scripted preservation
check confirmed all 65 pre-existing branch tips at their recorded post-fast-forward positions,
all 17 existing checkout tips/statuses, both stash SHAs, and main/origin equality.
Documentation tooling used the existing primary checkout's installed Prettier through PATH;
no dependencies were installed or changed in either checkout. Application tests/build/production checks are deliberately
not run for this Git/documentation task; no runtime-readiness claim is made.

Next: Task 02 updates the authoritative migration tracker, incorporating the residual Team/Player
boundary review and separating UI work/product plans. Then Task 03 may remove approved integrated
worktrees only after preserving any needed ignored artifacts. Future implementation starts from
current main, never from the preserved old campaign.
