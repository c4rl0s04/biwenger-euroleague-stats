---
title: Batch 001 second review — changes requested
description: Correction review at 7e900200 and a smaller worker checkpoint.
audience:
  - agent
  - maintainer
status: active
---

# Standings second review — CHANGES_REQUESTED

Candidate: `7e900200ee517c4069b3561f17e0b7689735f56b`.
Correction diff: `git diff 5f47ecf6...7e900200`.
Full comparison base remains `38bf2de48fc1c73165389536ef7ecbed2307ebad`.
Paths/lines below refer to the Standings worker checkout at that candidate.
The appended completion paragraph in the worker report is uncommitted.

Read the [first review](001-standings.md) and [assignment](../batches/001-standings.md).
This review supersedes their execution order, not their compatibility requirements.

## What improved

Substantial SQL moved into the feature. Components moved physically. Section page imports
feature contracts. Sixteen additional APIs and the section page are now registered.
Typed partial mocks fix the original TS2698 errors; all 107 existing focused tests pass.
Theoretical orchestration moved out of the query function.
The accidentally deleted tracked scratch/check_points.js was restored.

These improvements do not establish compatibility or a working production build.

## Standards — four blocking groups

1. **P1: Incorrect field conversion and omission.**
   performance.mapper.ts:14-132 uses any and blanket Number/String conversions.
   The real users.id column is text. An in-memory execution of mapHeatCheckStat changed
   user_id "123" to 123, name null to "null", and icon null to "".
   Rolling-average mapper lines 43-54 drops data[].short_name emitted by advanced.query.ts:347-351
   and consumed by components/RollingAverageCard.js:40. Position history/round metadata is also
   truncated. Keep original field names, values, nested fields and nulls; derive models from
   actual query output, not inaccurate legacy interfaces. All five records modules still use any.

2. **P1: New cross-feature cycle.**
   queries/performance.query.ts:90,508 copies Managers contributor re-exports into Standings,
   producing Managers -> Standings -> Managers. These unrelated exports should remain in
   the legacy mixed module as required by the assignment. Do not weaken cycle checks.
   New base.query.ts also imports its own feature barrel; use deliberate internal imports.

3. **P1: Unauthorized cache changes.**
   services/performance.service.ts:26-52, draft.service.ts:28,39 and theoretical.service.ts:19-55
   introduce React cache wrappers absent from the original services. This is request memoization,
   not evidence of cross-user persistent caching, but it changes the explicitly frozen read policy.
   Remove new memoization; preserve the original advanced in-memory cache keys/TTL/error behavior.

4. **P1: Wrong directory source and scope expansion.**
   theoretical.service.ts:32 uses getExtendedStandings instead of the approved active-manager
   directory contract, changing selection/order basis and read dependencies.
   Use a feature query adapter over shared core/manager-directory.ts.
   base.query.ts:129-170 also moves excluded leader-comparison/league-average helpers and causes
   unrelated Dashboard/Compare edits; restore their permitted legacy ownership and avoid broad casts.

## Spec — four blocking groups

1. **P1: Screen moves break imports/build.**
   src/app/(app)/standings/page.js:1-2 imports deleted global screen paths.
   components/DesktopStandingsScreen.js:32-63 still imports the deleted global barrel/cards,
   including dynamic chart imports. Build reports 18 module-resolution errors.
   Use the public contract from the page and feature-relative imports inside the desktop screen.
   Preserve dynamic loading options. Do not recreate parallel global implementations.

2. **P1: Draft response is incompatible.**
   services/draft.service.ts:28-33 returns { performance: [...] } instead of the original array.
   components/InitialSquadAnalysisCard.js:33 calls data.map, so the new successful response is
   unusable by its current consumer. draft.mapper.ts:13-20 also drops actual_points,
   potential_points and roi_percentage in favor of total_points.
   Other draft mappers invent/rename fields or default missing ones instead of preserving query
   output. Restore complete original envelopes and field contracts throughout draft analytics,
   all seven initial-squad-stats collections, and detailed squads. Preserve the old null fallback.

3. **P1: Real contract tests and typed screen boundary still missing.**
   No new characterization/mapper/service/page/HTTP-chain tests were added; only three old
   files changed. Existing route mocks bypass the changed services.
   MobileStandingsScreen.tsx still uses Record<string, any>; StandingsSectionScreen.tsx:25,35
   forwards unknown data into MobileRecordList, and section orchestration remains in the page.
   Complete the assignment's view-model/screen service work and tests, rather than claiming
   renamed files establish the new boundary.

4. **P2: Scope/report cleanliness.**
   Correction commit contains 18 scratch rewrite scripts although the report says they were
   cleaned. The worker report is dirty and still contains stale initial assertions.
   Remove only worker-added migration scripts from the candidate in a scoped follow-up;
   preserve pre-existing scratch files. Fix committed-range SQL whitespace and report exact
   checks/results/remaining work. Do not claim all corrections complete.

## Independent validation

Pinned Node 24.20.0; no production data/provider operations.

| Check                               | Result                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------- |
| Typecheck                           | PASS                                                                    |
| Focused Standings + APIs            | 107 PASS, 13 files; inadequate new-contract coverage                    |
| Architecture                        | FAIL: Managers/Standings cycle and unresolved deleted component imports |
| SKIP_DB=true npm run build          | FAIL: 18 module-resolution errors                                       |
| git diff --check 38bf2de4..7e900200 | FAIL: SQL/scratch whitespace                                            |
| Clean checkout                      | NO: uncommitted report appendix                                         |
| Synthetic mapper replay             | Confirmed ID/null conversion and short_name removal                     |

Full suite, lint, schema/Drizzle and browser checks deferred after blocking failures.
No production deployment, no worker source edits by reviewer. The previous baseline passed
typecheck/all 107 focused tests and had a verified production build before these moves.

## Next worker task: checkpoint A only

Do not attempt another broad "complete every correction" pass.
Resume the same worker branch; do not rebase, merge, push or start another batch.

1. Fix deleted component imports, preserving original UI/dynamic loading behavior.
2. Remove the Managers contributor exports from Standings and retain them in their original
   legacy owner so current consumers still resolve them without a feature cycle.
3. Run typecheck, architecture and one database-disabled production build, separately. Stop at
   any failure; fix only errors caused by these two changes. No assertions/checker exemptions.
4. Record exact results and source SHA(s) in the worker report. Mark
   "CHECKPOINT A — awaiting review; remaining second-review findings still open".
   Commit only scoped changes/report; leave the existing user report edits preserved and
   incorporate them accurately. Do not claim full Batch 001 completion.
5. Stop. The coordinator reviews this checkpoint before authorizing payload/model corrections.

If another architectural decision is needed, report it instead of guessing.
All other findings remain blockers and are deliberately not assigned to checkpoint A.
The original no-secrets/no-production/no-schema/no-dependency restrictions remain in force.
