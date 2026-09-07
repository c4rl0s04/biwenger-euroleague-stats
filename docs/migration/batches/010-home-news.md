---
title: Batch 010 — Home and News reads
description: Blocked planning placeholder requiring a source-backed assignment before execution.
audience:
  - agent
  - maintainer
status: draft
---

# Home and News reads

**DRAFT / BLOCKED — do not execute.** Return to the [queue](../README.md).
Only Batch 001 is authorized for the pilot. No branch/base/write set has been reserved here.

- Intended scope: Assign Home feed composition and News read ownership; split into two batches if independent domains warrant it.
- Required discovery: Inspect actual home feed, filters, pagination, last-round projections and News contracts before choosing ownership. Preserve existing mobile activity feed.
- Dependency review: Owning domain contracts for all summaries; no global-query grab bag.

Before promotion, the coordinator must inspect the current code, fill every field in the
[assignment template](../assignment-template.md), pin an exact base, identify all routes/consumers,
reserve shared files and obtain the user's next-batch/parallel approval. No worker should infer
missing scope, create a worktree, run production checks or implement this placeholder.

Validation follows the [worker protocol](../worker-protocol.md) and independent
[review checklist](../reviewer-checklist.md) once a runnable assignment is approved.
