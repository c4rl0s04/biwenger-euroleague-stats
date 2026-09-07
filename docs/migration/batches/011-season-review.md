---
title: Batch 011 — Season Review ownership
description: Blocked planning placeholder requiring a source-backed assignment before execution.
audience:
  - agent
  - maintainer
status: draft
---

# Season Review ownership

**DRAFT / BLOCKED — do not execute.** Return to the [queue](../README.md).
Only Batch 001 is authorized for the pilot. No branch/base/write set has been reserved here.

- Intended scope: Move existing pure season-review engine and artifact readers to an explicit owner.
- Required discovery: Trace actual page/section consumers, generation versus read paths, schemas and artifact locations. Do not regenerate artifacts or migrate simulation tooling incidentally.
- Dependency review: Freeze historical scoring/artifact contracts; inspect whether this can run independently after the pilot.

Before promotion, the coordinator must inspect the current code, fill every field in the
[assignment template](../assignment-template.md), pin an exact base, identify all routes/consumers,
reserve shared files and obtain the user's next-batch/parallel approval. No worker should infer
missing scope, create a worktree, run production checks or implement this placeholder.

Validation follows the [worker protocol](../worker-protocol.md) and independent
[review checklist](../reviewer-checklist.md) once a runnable assignment is approved.
