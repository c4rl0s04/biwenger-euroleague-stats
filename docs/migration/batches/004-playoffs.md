---
title: Batch 004 — Playoffs read experience
description: Sequential campaign assignment for the existing Playoffs read domain.
audience:
  - agent
  - maintainer
status: active
---

# Playoffs read experience

**ACTIVE — C04 sequential campaign assignment, not a parallel worker dispatch.**
The approved [completion plan](../completion-plan.md) supersedes the historical pilot restriction.
Base: 3c0517e2; branch refactor/architecture-completion in the sibling architecture-completion worktree.
Source inventory, contracts, frozen writes and acceptance are in the [C04 receipt](../reports/c04-playoff-reads.md).
Reserved writes: features/playoffs, its two pages, existing Playoffs desktop/phone components,
playoffService and tests, a narrow Teams catalogue contract if required, architecture policy,
scoped browser fixtures/references and campaign documentation. No other domain implementation.

- Intended scope: Move the existing Playoffs read experience and its distinct scoring rules.
- Required discovery: Inspect actual brackets, prediction-view routes, historical snapshots and mutation boundaries. Do not unify formulas with Predictions by appearance.
- Dependency review: Matches/Rounds and relevant manager contracts; coordinate shared-file ownership with Predictions.

Execute locally and sequentially under the campaign authorization. No push, merge or deployment.
Stop for a newly discovered behavioral/security decision; preserve writes and production configuration.

Validation follows the [worker protocol](../worker-protocol.md) and independent
[review checklist](../reviewer-checklist.md) once a runnable assignment is approved.
