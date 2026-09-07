---
title: Standings checkpoint B review — small corrections required
description: Preserve nulls and accurate analytics types without unrelated interface changes.
audience:
  - agent
  - maintainer
status: active
---

# Checkpoint B — CHANGES_REQUESTED

Candidate: `04905c68e4683f71570b075dea26580d634badc3`.
Checkpoint base: `0c28966718899b535f1200b8e8482e06cf53f8ea`.
Original behavior reference: `38bf2de4`.
Read the [checkpoint B assignment](003-standings.md). No later checkpoint is authorized.

## Correctly completed

Analytics returns the original array again; actual_points, potential_points and roi_percentage
are restored. Its new React cache wrapper is removed. Six tests now exercise the actual
handler/service/mapper via a mocked persistence seam. Retain these improvements.

## Standards

1. **P1 — Value and type contract remains wrong.**
   `server/mappers/draft.mapper.ts:13-21` still accepts any and coerces values.
   Null user_name becomes ""; empty icon becomes null. The contract requires preserving
   source values, not choosing display defaults. Both InitialSquadPerformance declarations
   in draft.query.ts and DraftPerformanceViewModel still declare non-null user_name.
   `models/draft.ts:71-73` also retains the old object-wrapper DraftAnalyticsViewModel,
   inconsistent with the corrected service array.

2. **P2 — Unrelated query types no longer match their SQL.**
   This commit changes TheoreticalBreakdown.player_total_points, InitialSquadRetainedPoints.total_points
   and InitialSquadPotentialAdvanced.total_points to invented actual/potential/ROI fields.
   Their SQL still returns the old names. These three checkpoint changes must be reverted,
   not extended into more service changes.

## Spec

1. **P1 — The new test accepts the regression.**
   `server/draft-analytics-http.contract.test.ts:96` expects user_name "" for a null input
   and explains that the mapper coalesces it. The assignment expressly required null.
   Change the expectation to the original contract first; confirm it fails before fixing
   the mapper. Passing a test that encodes changed behavior is not compatibility evidence.

2. **P2 — A prohibited scratch script was committed.**
   `scratch/fix_draft_analytics.mjs` was newly added, despite checkpoint B prohibiting scratch
   scripts. It also fails checkpoint-range whitespace checks. Remove only this newly added file,
   not any pre-existing scratch contents.

## Independent validation

- Typecheck PASS.
- Architecture PASS: 792 modules / 44 protected entrypoints.
- Focused Standings/APIs: 113 PASS across 14 files; wrong null expectation noted above.
- Working tree clean.
- `git diff --check 0c289667..04905c68`: FAIL, new scratch script whitespace.
- Build/browser/full suite not rerun for this bounded review. Full batch remains unverified.

## Exact worker follow-up — finish B only

Use the existing branch, adding a scoped correction commit; no rebase or new batch.

1. Give mapDraftPerformance an explicit accurate input type for the existing normalized query
   projection. Return its seven original fields directly: user_id, user_name, user_color_index,
   icon, actual_points, potential_points, roi_percentage. No String/Number/|| defaults here;
   the existing query already performs its numeric conversion. Preserve null names, empty/null
   icons, leading-zero/non-numeric IDs, decimals/negative/zero scores.
2. Make user_name nullable in the analytics view model and its query result declaration(s).
   Consolidate only duplicate InitialSquadPerformance declarations if helpful. Change
   DraftAnalyticsViewModel to represent the array and explicitly type the analytics service's
   return. Do not change other draft model contracts.
3. Restore only the three unrelated interface hunks to checkpoint-base definitions.
   Do not restore the whole query file or undo the legitimate analytics changes.
4. Correct the null-name test expectation and add an empty-icon preservation case.
   Record the null test failing on the current mapper, then passing after the correction.
   Preserve existing tests for envelope, extra-field exclusion, errors, headers and cache removal.
5. Remove only scratch/fix_draft_analytics.mjs introduced by this checkpoint.
6. Run typecheck, architecture, the new analytics tests and the complete focused Standings/API
   suite. Check the cumulative checkpoint range from 0c289667 for whitespace.
7. Commit source/tests and report accurately, include actual source SHAs (no unresolved placeholder),
   mark "CHECKPOINT B — awaiting review; full batch incomplete", leave clean and stop.

Do not modify seven-part draft bundle behavior, other services, UI, SQL calculations, dependencies,
schema, credentials, configuration or production. Do not start checkpoint C.
