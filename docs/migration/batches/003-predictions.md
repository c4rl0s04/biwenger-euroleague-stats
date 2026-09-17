---
title: Batch 003 — Predictions read experience
description: Historical worker placeholder superseded by the completed C03 read slice.
audience:
  - agent
  - maintainer
status: active
---

# Predictions read experience

**IMPLEMENTED — do not dispatch a duplicate migration.** The Predictions read slice is completed
and verified on integration/predictions-migration. See the [C03 implementation and acceptance receipt](../reports/c03-prediction-reads.md).
The following notes preserve the original worker-planning context.

- Intended scope: Move existing prediction read composition and scoring ownership into a bounded feature.
- Required discovery: Inventory all page/section/API consumers and distinguish pure reads from submissions or provider actions. Keep prediction-specific rules separate from Playoffs.
- Dependency review: Round calendar and manager/player contracts; obtain a decision for mixed read/write flows.

Before promotion, the coordinator must inspect the current code, fill every field in the
[assignment template](../assignment-template.md), pin an exact base, identify all routes/consumers,
reserve shared files and obtain the user's next-batch/parallel approval. No worker should infer
missing scope, create a worktree, run production checks or implement this placeholder.

Validation follows the [worker protocol](../worker-protocol.md) and independent
[review checklist](../reviewer-checklist.md) once a runnable assignment is approved.
