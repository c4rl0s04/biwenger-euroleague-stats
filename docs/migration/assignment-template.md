---
title: Migration assignment template
description: Coordinator checklist for promoting a future batch to runnable status.
audience:
  - agent
  - maintainer
status: active
---

# Assignment template

A draft cannot be dispatched until every field below is resolved from current code.

- Batch ID, title, READY status and single assigned owner.
- Exact base SHA (not merely latest main), required ancestor and documentation-pack location.
- Dedicated branch and sibling worktree, report path, resume rules.
- Exact pages, sections, APIs, dispatcher variants and their current source paths.
- Existing feature boundary versus legacy ownership; consumer/query/cache inventory.
- Permitted source files and exact shared-file edits; forbidden neighboring areas.
- Required cross-feature contracts and potential graph cycles.
- Input, identity, HTTP, cache, formula, serialization and visual compatibility decisions.
- Implementation steps and logical commit boundaries.
- Required tests to author, worker checks and reviewer validation commands.
- Dependencies, stop conditions and exact completion boundary.
- Parallel reservation: write-set overlap resolved before READY.

Link to [worker protocol](worker-protocol.md), [review checklist](reviewer-checklist.md)
and [report template](report-template.md) instead of duplicating them.
Only the coordinator changes the queue; workers report from their own branch.
