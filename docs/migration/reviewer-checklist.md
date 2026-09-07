---
title: Migration independent review
description: Evidence required before a worker result may be accepted.
audience:
  - agent
  - maintainer
status: active
---

# Independent reviewer checklist

Review one exact base-to-candidate commit range. Read the assignment and worker report first.
Confirm recorded base, ancestry, clean checkout, file ownership and no unrelated changes.
Worker assertions are claims to verify, not acceptance evidence by themselves.

## Code review

- Trace real consumers through services, query layer, mapping and presentation.
- Check cross-feature graph, client safety, server-only guards and exact policy exceptions.
- Compare SQL tokens/parameters, season boundaries, ordering, formulas, nulls/numeric strings,
  non-finite values, omitted fields, permissive inputs and failure behavior with the recorded base.
- Trace identity and caching through every helper, not only route headers. Verify no session-derived
  result can enter public shared caching and no credentials reach responses/props/logs.
- Verify no duplicate query implementations and no broken legacy consumers.
- Confirm the report's claimed complete scope includes pages, phone sections and actual HTTP consumers.
- Check tests exercise real services/mappers/handlers, not mocks that merely reproduce the expected output.
- Reject missing required tests, checker relaxations, new undocumented exceptions and unrelated fixes.

## Reviewer-owned validation

Use pinned runtime and repository [testing instructions](../contributing/testing.md).
Establish any missing baseline on an isolated checkout of the recorded base, not by
checking out old code over the worker's work. Do not infer a baseline failure from a candidate failure.

Run focused assigned/cross-feature tests, then `npm run verify` (full unit suite, lint,
typecheck, architecture/docs/skills, database-disabled build, schema metadata, Drizzle, diff).
Run `git diff --check <base>..<candidate>`; a clean working diff alone is insufficient.
Check formatting of changed files, including moved SQL templates.

When screens move, use the disposable synthetic browser runner and compare original desktop/phone
screens. New references must come from the unchanged base with the same deterministic fixture,
never from candidate output. Inspect painted charts, data, interactions and navigation; don't
mask failures by removing error guards or accepting blank charts. Run the full browser suite.
Do not use real provider credentials, production databases or auth bypasses.
Record unavailable platforms and production visual checks as remaining limitations.

## Outcome

Write findings with priority, file/line, reproducible evidence and smallest scoped correction.
Use CHANGES_REQUESTED, BLOCKED or VERIFIED with exact candidate SHA and command outcomes.
Missing required validation cannot yield VERIFIED. Return corrections to the same worker/branch;
review the new diff and rerun affected checks. Do not quietly become a second implementation worker.

No merge/push/deploy is authorized by review. Integration requires a separate user-approved
step and a fresh review of combined ancestry/state. If base changed, the approved integrator
handles it; never force a worker rebase or silently accept conflicts.
