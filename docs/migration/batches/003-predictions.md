---
title: Batch 003 — Predictions read experience
description: Blocked planning placeholder requiring a source-backed assignment before execution.
audience:
  - agent
  - maintainer
status: draft
---

# Predictions read experience

**DRAFT / BLOCKED — do not execute.** Return to the [queue](../README.md).
Only Batch 001 is authorized for the pilot. No branch/base/write set has been reserved here.

- Intended scope: Move existing prediction read composition and scoring ownership into a bounded feature.
- Required discovery: Inventory all page/section/API consumers and distinguish pure reads from submissions or provider actions. Keep prediction-specific rules separate from Playoffs.
- Dependency review: Round calendar and manager/player contracts; obtain a decision for mixed read/write flows.

Before promotion, the coordinator must inspect the current code, fill every field in the
[assignment template](../assignment-template.md), pin an exact base, identify all routes/consumers,
reserve shared files and obtain the user's next-batch/parallel approval. No worker should infer
missing scope, create a worktree, run production checks or implement this placeholder.

Validation follows the [worker protocol](../worker-protocol.md) and independent
[review checklist](../reviewer-checklist.md) once a runnable assignment is approved.
