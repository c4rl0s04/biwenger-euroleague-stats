---
title: Standings checkpoint A accepted — checkpoint B assignment
description: Verified import and cycle fixes followed by a single-endpoint compatibility repair.
audience:
  - agent
  - maintainer
status: active
---

# Checkpoint A accepted; Batch 001 remains CHANGES_REQUESTED

Reviewed candidate: `0c28966718899b535f1200b8e8482e06cf53f8ea`.
Source correction: `4edbfd8d06b1cc30d9c662ce7722be0a7650972b`.
Delta base: `7e900200ee517c4069b3561f17e0b7689735f56b`.

## Standards

No new findings in this delta. Page imports use the feature public contract;
desktop imports are feature-local. Managers contributor exports remain in the
legacy owner, not inside Standings. This changes ownership without calculation changes.

## Spec

No new findings in checkpoint A. All five dynamic chart imports preserve their
original loading skeletons and ssr:false settings. Only the assigned repairs and report changed.
This is checkpoint acceptance, not acceptance of the complete migration.

## Independent validation

- Pinned Node 24.20.0: typecheck PASS.
- Architecture PASS: 792 modules / 44 protected entrypoints; prior unresolved imports/cycle gone.
- SKIP_DB=true production build PASS; expected missing-provider configuration notices remain.
- Checkpoint-range whitespace check PASS; worker checkout clean.
- No full suite or browser rerun at this checkpoint; no integration, push or production changes.

All other [second-review findings](002-standings.md) remain open, including the full-range
whitespace/scratch issues. A passing build does not establish payload or visual compatibility.

# Worker checkpoint B — draft analytics endpoint only

Resume `refactor/standings-read-completion` in its existing worktree.
Start from the accepted SHA above; if HEAD differs, inspect and stop on unrelated changes.
Do not rebase, cherry-pick instruction docs, create another branch or start another batch.
The behavioral reference is the original application at `38bf2de4`, NOT the broken
payload introduced at `7e900200`.

## Exact scope

Repair only the data produced by `fetchInitialSquadAnalytics`, exposed by
`GET /api/standings/analytics` and consumed by InitialSquadAnalysisCard.
Do not modify the UI to accommodate the wrong API. Do not fix the seven-part
initial-squad-stats bundle, performance/theoretical services or other open findings yet.

Permitted implementation:

- The analytics function in `src/features/standings/server/services/draft.service.ts`.
- Its specific model and mapDraftPerformance in models/draft.ts and server/mappers/draft.mapper.ts.
- Accurate row typing for this single query projection if needed, without SQL/calculation changes.
- Direct type exports if needed; new focused analytics mapper/service/HTTP tests.
- Worker report updates.

Preserve other functions in those mixed files. No bulk type rewriting, scratch scripts,
dependencies, shared helpers, auth, cache configuration, schema or production operations.

## Required contract

Original HTTP success is `{ success: true, data: [...] }`, including an empty array.
It is NOT `{ success: true, data: { performance: [...] } }`.

Each existing item has these fields:

- user_id (text ID, preserve exactly, including leading zeros/non-numeric strings);
- user_name (preserve its returned value, including null when the source names are null);
- user_color_index, icon (preserve null icon);
- actual_points, potential_points, roi_percentage (the existing query already normalizes
  these three numeric values; preserve zero, negatives and decimals without new fallbacks).

Read the original query/service/handler and current consumer before editing. SQL filters,
multipliers, numeric conversion, ordering, errors and season resolution must not change.
The mapper should allowlist these actual fields, not invent total_points or normalize identities.
Use explicit accurate types rather than any/casts that hide mismatches.

Keep route force-dynamic, public max-age=900/stale-while-revalidate=60, success status200,
and original 500 error envelope with private/no-store/max-age=0/must-revalidate.
The API is public statistical data, not a session fallback read.

Remove the newly introduced React cache wrapper from this analytics function only:
original calls re-read data. Leave other wrappers as explicitly pending review findings.
Do not change the shared cache helper, headers or unrelated draft function.

## Tests to author and run

Add focused tests which use the real analytics mapper and service and real Route Handler.
Mock only the query/persistence seam and server-only marker as required by the test harness;
do not mock fetchInitialSquadAnalytics or the mapper under test.

Cover:

1. Populated original-shaped records: exact JSON envelope, all seven fields and original order.
2. Empty array (not a wrapped object).
3. IDs like "007" and "manager-x", null names/icons, zero/negative/decimal scores.
4. Extra synthetic fields do not cross the mapper; no actual credentials in fixtures.
5. Query rejection preserves route status, error text/envelope and exact cache headers.
6. Both success and failure headers plus unchanged dynamic declaration.
7. No new cache wrapper around this function (source contract assertion if needed;
   two direct calls alone do not prove React request memoization is absent).

Ensure the tests would catch the current broken object envelope and field omissions.
Run the new tests against the pre-fix implementation first when practical and record expected
failures; then implement and rerun. Do not adjust expected data to the broken candidate.

## Finish and stop

Run typecheck, architecture, the new focused tests and:
`npm run test:run -- src/features/standings src/app/api/standings --maxWorkers=2`.
Check the checkpoint diff for whitespace and confirm no unrelated source changes.
Commit source/tests and the report locally in scoped commits. No full expensive build/browser
loop is required of this worker checkpoint.

Report exact source SHAs and commands, what changed and what remains pending.
Mark "CHECKPOINT B — awaiting review; full Batch 001 remains incomplete."
Leave clean and stop. Do not fix other endpoints until the coordinator reviews this one.
