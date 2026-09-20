---
title: Batch 007 — Public Market reads
description: Historical worker placeholder superseded by the completed C05 read slice.
audience:
  - agent
  - maintainer
status: active
---

# Public Market reads

**MERGED — do not dispatch a duplicate migration.** PR #38 integrated the public read slice.
Private provider operations remain separately gated. See the [master tracker](../tracker.md)
and [C05 receipt](../reports/c05-market-reads.md).
The following notes preserve the original worker-planning context.

- Intended scope: Establish ownership only for demonstrably public Market statistical reads.
- Required discovery: Trace identity and provider calls before scoping. Freeze private operations, link state, credentials and transaction actions; report inseparable mixed flows.
- Dependency review: Separate explicit read/private-operation boundary approval is required before READY.

Before promotion, the coordinator must inspect the current code, fill every field in the
[assignment template](../assignment-template.md), pin an exact base, identify all routes/consumers,
reserve shared files and obtain the user's next-batch/parallel approval. No worker should infer
missing scope, create a worktree, run production checks or implement this placeholder.

Validation follows the [worker protocol](../worker-protocol.md) and independent
[review checklist](../reviewer-checklist.md) once a runnable assignment is approved.
