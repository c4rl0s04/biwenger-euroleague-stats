---
title: Migration History
description: Preserved design records, rollout assignments, reviews, and acceptance evidence.
audience:
  - contributor
  - maintainer
  - agent
status: deprecated
---

# Migration history

Use the [architecture guide](../architecture/README.md) for current boundaries and
[GitHub Issues](https://github.com/c4rl0s04/biwenger-euroleague-stats/issues) for open work.
The material here records implementation and review at specific points in time.

- [Historical tracker](tracker.md), [overview](../architecture/migration-overview.md), and
  [release ledger](../architecture/migration-status.md) record planning, integration, and deployment.
- [Initial reconciliation](reports/2026-09-20-reconciliation.md) and
  [Standings review series](reviews/006-standings.md) preserve the starting point and pilot.
- [Worker protocol](worker-protocol.md), [assignment template](assignment-template.md),
  [review checklist](reviewer-checklist.md), and [report template](report-template.md) document the
  original workflow.
- [Browser verification history](browser-verification-history.md) explains capture provenance.
- [Agent setup history](../contributing/agent-setup-status.md) records the original setup rollout.
- [UI foundation proposal](../architecture/ui-foundation-v1.md) records the original pilot.
  Use the [design system](../product/design-system.md) for current UI conventions.
- [Operational evidence](../operations/history.md) indexes dated audits and investigations.

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
