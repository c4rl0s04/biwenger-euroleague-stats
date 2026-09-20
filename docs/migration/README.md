---
title: Migration entry point and historical worker index
description: Entry point to the authoritative tracker and preserved historical worker assignments.
audience:
  - agent
  - maintainer
status: active
---

# Migration entry point

Use the [master tracker](tracker.md) for current tasks, states, gates and next actions.
The table and pilot instructions below are a historical cross-reference, not a second queue.
New task numbers 01–27 are distinct from old worker IDs and campaign C-numbers.
No historical assignment authorizes dispatch or cleanup.

Current Git starting-point audit: [Task 01 reconciliation](reports/2026-09-20-reconciliation.md).
Consult it before using historical assignments; global status reconciliation is the next task.

## Historical pilot instructions

For a newly approved assignment, read [worker protocol](worker-protocol.md), then its exact scope.
The following pilot sequence is retained as history, not an instruction to restart Standings.
Pilot assignment: [001 — Standings read completion](batches/001-standings.md).
Historical pilot review: [C accepted; checkpoint D assignment](reviews/006-standings.md).
Previous checkpoint: [B accepted; checkpoint C assignment](reviews/005-standings.md).
Previous correction: [checkpoint B corrections](reviews/004-standings.md).
Previous checkpoint: [A accepted; B assignment](reviews/003-standings.md).
Historical batch findings: [second review](reviews/002-standings.md).
Earlier evidence: [first review](reviews/001-standings.md).
Current status: implementation complete; see the [release receipt](reports/rounds-standings-release.md).
Do not redispatch the historical checkpoint assignments or start a new batch automatically.
One worker only. No background dispatch, automatic polling or automatic integration exists.
Opening this file does not authorize starting every batch.

This is the user-approved implementation/review split: the worker implements and writes
essential tests; the coordinator independently reviews and runs the full acceptance checks.
A worker result is **implemented — awaiting independent verification**, never release-ready.

## Historical batch cross-reference

| ID   | Batch                                                                         | Dispatch state    | Dependency / next decision        |
| ---- | ----------------------------------------------------------------------------- | ----------------- | --------------------------------- |
| 001  | [Standings complete read experience](batches/001-standings.md)                | MERGED            | Historical Standings receipt      |
| 002  | [Tournament analytics and screens](batches/002-tournaments.md)                | MERGED            | PR #35; no duplicate migration    |
| 003  | [Predictions read experience](batches/003-predictions.md)                     | MERGED            | PR #36; no duplicate migration    |
| 004  | [Playoffs read experience](batches/004-playoffs.md)                           | MERGED            | PR #37; no duplicate migration    |
| 005  | [Manager directory and remaining analytics](batches/005-manager-directory.md) | MERGED            | PR #39; commands remain gated     |
| 006  | [Schedule composition](batches/006-schedule.md)                               | HISTORICAL DRAFT  | Tracker Task 04                   |
| 007  | [Public Market reads](batches/007-market-reads.md)                            | MERGED            | PR #38; private flows Tasks 16–17 |
| 008  | [Dashboard composition](batches/008-dashboard.md)                             | HISTORICAL DRAFT  | Tracker Tasks 06–07               |
| 009  | [Compare composition](batches/009-compare.md)                                 | HISTORICAL DRAFT  | Tracker Task 05                   |
| 010  | [Home and News reads](batches/010-home-news.md)                               | HISTORICAL DRAFT  | Tracker Tasks 08–09               |
| 011  | [Season Review ownership](batches/011-season-review.md)                       | HISTORICAL DRAFT  | Tracker Tasks 10–11               |
| 012  | [Shell and remaining adapters](batches/012-shell.md)                          | HISTORICAL DRAFT  | Tracker Tasks 23–25               |
| Gate | [Security-sensitive deferred areas](security-gates.md)                        | APPROVAL REQUIRED | Tracker Tasks 12–21               |

Drafts are planning placeholders, **not executable specifications**. IDs are tracking identifiers,
not promises that every batch is equally sized or that unrelated work must run sequentially.
Only the coordinator may mark a draft READY after source inspection, a pinned base, exact
write ownership, dependencies, and acceptance criteria are recorded.

## State and ownership

Coordinator owns this queue, assignment approval, shared-contract decisions and integration.
Worker owns its isolated checkout and its report at `docs/migration/reports/001-standings.md`.
A [pilot report stub](reports/001-standings.md) is included; read its version on the worker
branch for actual progress, not the unchanged copy on the instruction branch.
A READY queue row is dispatch permission for the named pilot, not a live process monitor.
Read the worker report/branch to determine actual progress; workers must not edit the shared queue.

Lifecycle: READY -> IMPLEMENTING -> READY_FOR_REVIEW -> CHANGES_REQUESTED or VERIFIED.
BLOCKED records a concrete decision needed. VERIFIED is not INTEGRATED or DEPLOYED.
The coordinator records those later only with evidence and explicit release approval.

## Review and future parallelism

Use the [reviewer checklist](reviewer-checklist.md) and [report template](report-template.md).
Use the [assignment template](assignment-template.md) to turn a draft into a real assignment.

Parallel execution is disabled for this pilot. If later approved, each worker gets one assignment,
one branch and one sibling worktree. The coordinator reserves overlapping files before dispatch.
Shared barrels, legacy adapters, architecture policy, fixtures and this queue are shared resources:
assign a single owner or explicit per-worker changes, then review sequentially on an integration branch.
A worktree is isolation, not a lock on logical contracts. Workers never resolve cross-batch conflicts,
rebase each other, merge, force-push or change another worker's checkout.

## Original Git checkpoint (historical)

Application baseline: `5be73a8eb1edd18b1e7ced259488e0da51f3e3d7` on
`refactor/rounds-read-completion`. Main was `713d2a3b` when this pack was created.
At dispatch, Rounds and the preceding Profile receipt were local/unmerged. This documentation pack
is stacked on that Rounds commit on `docs/migration-worker-playbook`.
Do not mistake that local stack for production, or independently integrate its descendants.

[Migration coverage](../architecture/migration-overview.md) remains the feature-status summary.
