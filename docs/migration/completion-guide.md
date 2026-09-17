---
title: Migration completion guide
description: Plain-language explanation and execution checkpoint for the complete architecture campaign.
audience:
  - maintainer
  - agent
status: active
---

# Migration completion guide

## In plain language

The website should look and behave the same. We are reorganizing the code behind it:
pages ask services for data; services coordinate queries and turn database results into
safe, clearly defined data for the screens.

1. Finish moving the remaining page data and components into their owning features.
2. Handle sensitive areas separately, without changing login, credentials or provider behavior.
3. Finish shared navigation/components and remove old duplicate code once nobody uses it.
4. Check every route, API, dependency boundary and desktop/mobile screen.
5. With release approval, integrate, push, verify production and close the documentation.

The detailed instructions and acceptance criteria are in the [completion plan](completion-plan.md).
Tests are part of finishing the migration, not optional extra work.

## Inspected checkpoint

This is a source/documentation checkpoint, not a fresh execution of the recorded tests.
Primary checkout is clean at `354f66e1585cb59a15efe96f094defdba6ad1e65`.
The existing campaign worktree is `../biwengerstats-next-architecture-completion`, branch
`refactor/architecture-completion`, committed tip `1e889c8e` (inspection: 2026-09-13).
Its `docs/migration/campaign-execution.md` and per-package receipts are the execution ledger.
Read those files in that worktree before resuming; do not restart from this older planning branch.

| Area                                                                              | State at inspection                                   | Remaining work                                                                                                                                       |
| --------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Matches, Teams, Players, Profile, Rounds, Standings, Search reads                 | Existing migrated foundations on main                 | Final consumer, adapter and shared-UI closure in C14/C13                                                                                             |
| C00 inventory and C01 Managers                                                    | In progress locally                                   | Complete call-chain classification and remaining analytics/adapters                                                                                  |
| C02 Tournaments, C03 Predictions, C04 Playoffs                                    | Reported locally verified in campaign receipts        | Aggregate visual/acceptance checks and release; not deployed                                                                                         |
| C05 public Market | Checkpoints A–P committed locally; feature incomplete | Reconcile uncommitted desktop/chart checkpoint Q; finish populated chart and visual closure; resolve bids approval separately |
| C06 Season Review                                                                 | Pending                                               | Engine/artifact/read ownership and screens                                                                                                           |
| C07 Schedule, C08 Compare, C09 Dashboard, C10 Home/News                           | Pending                                               | Compose owning domain contracts and retire duplicate reads                                                                                           |
| C11 Accounts/Settings, Lineup/private Market, Hoopgrid, Assistant, other commands | Security-gated                                        | Approved bounded implementation and security/compatibility checks                                                                                    |
| C12 infrastructure and cache lifecycle                                            | Pending                                               | Assign scripts, ingestion, caches and retained infrastructure deliberately                                                                           |
| C13 shell and shared/domain UI                                                    | Pending                                               | Finish component ownership without redesign                                                                                                          |
| C14 exhaustive closure                                                            | Pending                                               | Zero unassigned runtime code or temporary migration debt; complete verification                                                                      |
| C15 release                                                                       | Approval-gated                                        | Main integration, CI, deployment, smoke checks and preservation audit                                                                                |

Market checkpoints through P are committed. J closes shared Player form ownership; K types duel
presentation; L owns non-bids phone models; M types the drawer boundary; N covers metric renderers;
O adds listing interaction evidence; P types listing and modal presentation. The campaign worktree
currently contains uncommitted checkpoint Q desktop aggregate/chart types, contract tests and receipt
changes. Preserve and reconcile these before continuing. Recover its verification evidence and finish
required browser comparisons before accepting or committing Q. Populated rolling charts, remaining
ownership review and broader viewport/Linux coverage must still be explicitly closed. This planning
inspection did not rerun application validation or certify the uncommitted checkpoint.
The original Market visual-baseline branch is at `a4d105cf`. Preserve its original references;
never regenerate them from migrated output to make a comparison pass.
The phone bids page has a reported pre-existing non-iterable duel-data failure. Confirm the
current evidence and obtain a separate behavior-fix decision; do not hide it with a structural move.
No application files were edited for this planning update.

## Instructions for the executing agent

Read AGENTS.md, the completion plan, campaign execution ledger and current package receipt.
Inspect Git state first and preserve existing work. Continue from the current checkpoint, not
from historical worker assignments. Keep one sequential campaign worktree and logical commits.

For each package, enumerate actual routes, API methods, actions and consumers; pin current
contracts; migrate the complete approved boundary; run the required checks; record evidence.
Use focused checks during development and combined acceptance when useful, but never label an
untested package verified. Do not repeatedly review unchanged packages just to generate status.

Any newly discovered migration task must be assigned to C00–C15 and closed before claiming
completion. Permanent infrastructure and tested legacy HTTP URLs may remain with explicit ownership;
unexplained wrappers, unresolved exceptions and unfinished visual checks may not.

Stop for required security decisions or release approval. The existence of a plan is not permission
to mutate production, change credentials, alter schema, deploy or bypass a gate.

The campaign is finished only when implementation, release and the final audit are all complete.
If approval or verification is missing, report that exact remaining item instead of saying “done.”
