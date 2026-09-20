---
title: Batch 004 — Playoffs read experience
description: Historical worker placeholder superseded by the completed C04 read slice.
audience:
  - agent
  - maintainer
status: active
---

# Playoffs read experience

**MERGED — do not dispatch a duplicate migration.** PR #37 integrated the read slice.
See the [master tracker](../tracker.md) and [C04 receipt](../reports/c04-playoff-reads.md).
The following notes preserve the original worker-planning context.

- Intended scope: Move the existing Playoffs read experience and its distinct scoring rules.
- Required discovery: Inspect actual brackets, prediction-view routes, historical snapshots and mutation boundaries. Do not unify formulas with Predictions by appearance.
- Dependency review: Matches/Rounds and relevant manager contracts; coordinate shared-file ownership with Predictions.

Before promotion, the coordinator must inspect the current code, fill every field in the
[assignment template](../assignment-template.md), pin an exact base, identify all routes/consumers,
reserve shared files and obtain the user's next-batch/parallel approval. No worker should infer
missing scope, create a worktree, run production checks or implement this placeholder.

Validation follows the [worker protocol](../worker-protocol.md) and independent
[review checklist](../reviewer-checklist.md) once a runnable assignment is approved.
